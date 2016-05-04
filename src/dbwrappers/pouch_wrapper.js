(function(LawncipherDrivers, window){

	var PouchDB = window.PouchDB;
	var pouchInstances = {};
	var pouchWrappers = {};

	var forceTypeTests;

	var sodium = window.sodium;
	var to_base64 = sodium.to_base64, from_base64 = sodium.from_base64;
	var to_string = sodium.to_string, from_string = sodium.from_string;

	LawncipherDrivers.initPouch = function(dbName, callback, adapter){
		if (!(typeof dbName == 'string' && dbName.length > 0)) throw new TypeError('dbName must be a non-empty string');
		if (typeof callback != 'function') throw new TypeError('callback must be a function');

		if (adapter && typeof adapter != 'string') throw new TypeError('when defined, adapter must be a string');
		adapter = adapter || 'websql';

		forceTypeTests = typeof window.forceTypeTests == 'boolean' ? window.forceTypeTests : true;

		if (pouchWrappers[dbName]){
			callback(undefined, pouchWrappers[dbName]);
			return;
		}

		var pInstance = new PouchDB(dbName, {adapter: adapter});
		pouchInstances[dbName] = pInstance;

		var pouchWrapper = new DBWrapper(
			'PouchDB',
			getFn(pInstance, forceTypeTests),
			findFn(pInstance, forceTypeTests),
			findOneFn(pInstance, forceTypeTests),
			saveFn(pInstance, forceTypeTests),
			bulkSaveFn(pInstance, forceTypeTests),
			updateFn(pInstance, forceTypeTests),
			removeFn(pInstance, forceTypeTests),
			clearAllFn(pInstance, pouchInstances, pouchWrappers),
			pInstance
		);

		pouchWrappers[dbName] = pouchWrapper;

		LawncipherDrivers.pouchWrappers = pouchWrappers;
		LawncipherDrivers.pouchInstances = pouchInstances;

		callback(undefined, pouchWrapper);

		function mapFnFactory(q){
			//Shallow copy of query, ignoring lawncipher-specific query operators
			var query = {};
			var queryParts = Object.keys(q);
			for (var i = 0; i < queryParts.length; i++){
				if (queryParts[i].indexOf('$') == 0) continue;
				query[queryParts[i]] = q[queryParts[i]];
			}
			/*for (var queryPartName in q){
				if (queryPartName.indexOf('$') == 0) continue;
				query[queryPartName] = q[queryPartName];
			}*/
			//Re-init queryParts with cleaned-up query
			queryParts = Object.keys(query);

			return function(d, emit){
				for (var i = 0; i < queryParts.length; i++){
					var dValue = d[queryParts[i]], qValue = query[queryParts[i]];
					if (!dValue) return;

					var dType, qType;
					if (dValue instanceof Date){
						dType = 'date';
						dValue = dValue.getTime();
					}
					if (qValue instanceof Date){
						qType = 'date';
						qValue = qValue.getTime();
					}
					dType = dType || typeof dValue;
					qType = qType || typeof qValue;

					if (dType != qType) return;
					if (dValue != qValue) return;
				}

				emit(d._id, null);
			}
		}

		function stringContainsAny(s, k){
			if (typeof k == 'string') return s.indexOf(k) != -1;
			if (!(Array.isArray(k) && k.length > 0)) throw new TypeError('when k is not a string, it must be a non-empty array');

			//Checks whether any of the strings in k occur in s
			//Does that by summing up the results of s.indexOf() calls
			//If no k string is found, then sIndexes = -k.length
			//Else, sIndexes > -k.length
			var sIndexes = 0;
			for (var i = 0; i < k.length; i++) sIndexes += s.indexOf(k[i]);
			return sIndexes > -k.length;
		}

		function mapIdFnFactory(s){
			return function(d, emit){
				if (d._id === s) emit(d._id);
			}
		}

		function processResponseFactory(_cb, indexOnly){
			return function(err, dbResponse){
				if (err){
					_cb(err);
					return;
				}

				var resultSet = dbResponse.rows;
				var attachmentsFirstRs = new Array(resultSet.length);

				var firedCbs = 0;

				function endOne(){
					firedCbs++;
					if (firedCbs == resultSet.length){
						_cb(undefined, attachmentsFirstRs);
					}
				}

				for (var i = 0; i < resultSet.length; i++){
					var attList = resultSet[i]._attachments && Object.keys(_attachments)
					if (!indexOnly && attList && attList.length > 0){
						var theattachment = resultSet[i]._attachments[attList[0]];
						//var aType = theattachment.content_type;
						//if (content_type.indexOf('text') != -1) attachmentsFirstRs.push(theattachment.data);
						//if (content_type.indexOf('json') != -1) attachmentsFirstRs.push(JSON.parse(theattachment.data));
						processResponseBlob(theattachment, i, attachmentsFirstRs, function(_pErr){
							if (_pErr){
								_cb(_pErr);
								return;
							}

							endOne();
						});
					} else {
						attachmentsFirstRs[i] = resultSet[i];
						endOne();
					}
				}

				//_cb(undefined, attachmentsFirstRs);
			}
		}

		function processResponseBlob(b, bIndex, rs, _cb){
			if (forceTypeTests && typeof _cb != 'function') throw new TypeError('_cb must be a function');

			if (b instanceof Uint8Array || typeof b == 'string' || (typeof b == 'object' && Object.keys(b).length > 0)) return b;

			var isTextBased = stringContainsAny(b.type, ['text', 'json', 'xml']);

			//Read as Uint8Array
			var fr = new FileReader();
			fr.onloadend = function(evt){
				if (isTextBased){
					var tValue = evt.target.result;
					if (b.type.indexOf('json') != -1){
						try {
							tValue = JSON.parse(tValue);
						} catch (e){
							_cb(e);
							return;
						}

						//_cb(undefined, tValue);
						rs[bIndex] = tValue;
						_cb();

					} else {
						rs[bIndex] = tValue;
						_cb();

						//_cb(undefined, tValue);
					}
				} else {
					var bValue = new Uint8Array(evt.target.result);

					//_cb(undefined, bValue);
					rs[bIndex] = tValue;
					_cb();
				}
			};

			if (isTextBased) fr.readAsText();
			else fs.readAsArrayBuffer();
		}

		function prepareInlineAttachment(data, name){
			if (!(data instanceof Uint8Array || typeof data == 'object' || typeof data == 'string')) throw new TypeError('data must be either a Uint8Array, an object or a string');
			//Defaulting attachment name to 'a'
			name = name || 'a';
			if (typeof name != 'string') throw new TypeError('when provided, name must be a string');

			var aType, aValue;
			if (data instanceof Uint8Array){
				aType = 'application/octet-stream';
			} else if (typeof data == 'object'){
				aType = 'application/json';
				data = from_string(JSON.stringify(data));
			} else {
				aType = 'text/plain';
				data = from_string(data);
			}

			aValue = to_base64(data, true);

			var attachmentsObj = {};
			attachmentsObj[name] = {
				content_type: aType,
				data: aValue
			};

			return attachmentsObj;
		}

		function getFn(p, forceTypeTests){
			return function(id, cb){
				if (forceTypeTests){
					if (typeof id != 'string') throw new TypeError('id must be a string');
					if (typeof cb != 'function') throw new TypeError('cb must be a function');
				}

				p.get(id, {attachments: true}, function(err, doc){
					if (err){
						cb(err);
						return;
					}

					if (doc._attachments){
						console.log('attachments of doc ' + id);
						console.log(JSON.stringify(doc._attachments));
					}

					cb(undefined, doc);
				});
			}
		}

		function findFn(p, forceTypeTests){
			return function(q, cb, limit){
				if (forceTypeTests){
					if (!(typeof q == 'object' || typeof q == 'string')) throw new TypeError('q must either be a string (docId) or an object (compound query)');
					if (typeof cb != 'function') throw new TypeError('cb must be a function');
					if (limit && !(typeof limit == 'number' && Math.floor(limit) == limit && limit > 0)) throw new TypeError('when defined, limit must be a strictly positive integer number');
				}

				var queryOptions = {include_docs: true, attachments: true};

				if (typeof q == 'object'){
					if (limit) queryOptions.limit = limit;
					if (typeof q['$skip'] == 'number' && Math.floor(q['$skip']) == q['$skip'] && q['$skip'] >= 0) queryOptions.skip = q['$skip'];

					p.query(mapFnFactory(q), queryOptions, processResponseFactory(cb));
				} else { //typeof q == 'string'. Fetch by Id
					p.query(mapIdFnFactory(q), queryOptions, processResponseFactory(cb));
				}
			}
		}

		function findOneFn(p, forceTypeTests){
			return function(q, cb){
				if (forceTypeTests){
					if (!(typeof q == 'string' || typeof q == 'object')) throw new TypeError('query must either be a string (docId) or an object (compound query)');
					if (typeof cb != 'function') throw new TypeError('cb must be a function');
				}

				var queryOptions = {include_docs: true, attachments: true, limit: 1};

				if (typeof q == 'object'){
					p.query(mapFnFactory(q), queryOptions, processResponseFactory(cb))
				} else {
					p.query(mapIdFnFactory(q), queryOptions, processResponseFactory(cb));
				}
			}
		}

		function saveFn(p, forceTypeTests){
			return function(doc, attachment, cb, _attachmentId){
				if (forceTypeTests){
					if (!(doc || attachment)) throw new TypeError('either doc or attachment must be defined');
					if (doc && typeof doc != 'object') throw new TypeError('when defined, doc must be an object');
					if (attachment && !(attachment instanceof Uint8Array || typeof attachment == 'object' || typeof attachment == 'string')) throw new TypeError('when defined, attachment must either be a Uint8Array, an object or a string');
					if (typeof cb != 'function') throw new TypeError('cb must be a function');
					if (_attachmentId && typeof _attachmentId != 'string') throw new TypeError('when defined, _attachmentId must be a string');
				}

				//In case attachment is defined but doc is not, generate a dummy doc to "have the attachment attached to it"
				doc = doc || {_id: _attachmentId, addDate: Date.now()};

				p.post(doc, function(err, res){
					if (err){
						cb(err);
						return;
					}

					if (!res.ok){
						console.error('Received response on db.post: ' + JSON.stringify(res));
					}

					if (attachment){
						var aType;
						if (attachment instanceof Uint8Array) aType = 'application/octet-stream';
						else if (typeof attachment == 'object') aType = 'application/json';
						else aType = 'text/plain';

						var aBlob = new Blob([attachment]);
						p.putAttachment(res.id, 'a', res.rev, aType, function(err, aRes){
							if (err){
								cb(err);
								return;
							}

							//Curiosity... We are returning the docId anyway because it's enough to get the attachment again
							console.log('docId: ' + res.id);
							console.log('docId on attachment: ' + aRes.id);

							if (!aRes.ok){
								console.error('Received response on db.putAttachment: ' + JSON.stringify(aRes));
							}

							cb(undefined, res.id);
						});
					} else {
						cb(undefined, res.id);
					}
				});
			}
		}

		function bulkSaveFn(p, forceTypeTests){
			return function(docs, attachments, cb, attachmentsIds){
				if (forceTypeTests){
					if (!(docs || attachments)) throw new TypeError('either docs or attachments must be defined');
					if (docs && !(Array.isArray(docs) && docs.length > 0)) throw new TypeError('when defined, docs must be a non-empty array');
					if (attachments && !(Array.isArray(attachments) && attachments.length > 0)) throw new TypeError('when defined, attachments must be a non-empty array');
					if (docs && attachments && !(docs.length == attachments.length)) throw new TypeError('when both docs attachments are provided, they must have the same length');
					if (typeof cb != 'function') throw new TypeError('cb must be a function');
					if (attachmentsIds && !(Array.isArray(attachmentsIds) && attachmentsIds.length == attachments.length)) throw new TypeError('when defined, attachmentsIds must be an array with the same length as the attachments array');
					if (!docs && !(attachments && attachmentsIds)) throw new TypeError('when docs is not defined, both attachments and attachmentsIds must be defined');
				}

				var docsList = new Array(docs.length);
				for (var i = 0; i < docs.length; i++){
					var currentD = (docs && docs[i]) || {_id: attachmentsIds[i], addDate: Date.now()};
					var currentA = attachments && attachments[i];

					var mergedD = {};
					var currentAttributesList = Object.keys(currentD);
					for (var j = 0; j < currentAttributesList.length; j++){
						mergedD[currentAttributesList[j]] = currentD[currentAttributesList[j]];
					}
					/*for (var currentAttr in currentD){
						mergedD[currentAttr] = currentD[currentAttr];
					}*/
					if (currentA) mergedD['_attachments'] = prepareInlineAttachment(currentA);
					docsList[i] = mergedD;
				}

				p.bulkDocs(docsList, function(err, res){
					if (err){
						cb(err);
						return;
					}

					var docsIds = new Array(res.length);
					for (var i = 0; i < res.length; i++){
						docsIds[i] = res[i].id;
					}

					cb(undefined, docsIds);
				});

			}
		}

		function updateFn(p, forceTypeTests){
			return function(query, newAttributes, newAttachment, cb, indexOnly){
				if (forceTypeTests){
					if (!(typeof query == 'string' || typeof query == 'object')) throw new TypeError('query must be either a string or an object');
					if (!(newAttributes || newAttachment)) throw new TypeError('either newAttributes or newAttachment must be defined');
					if (newAttributes && newAttachment) throw new TypeError('newAttributes and newAttachment cannot be defined and updated at the same time');
					if (newAttributes && typeof newAttributes != 'object') throw new TypeError('when defined, newAttributes must be an object');
					if (newAttachment && !((newAttachment instanceof Uint8Array) || typeof newAttachment == 'object' || typeof newAttachment == 'string')) throw new TypeError('when defined, newAttachment must be either a Uint8Array, a string or an object');
					if (typeof cb != 'function') throw new TypeError('cb must be a function');
				}

				var queryOptions = {include_docs: true, attachments: true};

				if (typeof query == 'object'){
					p.query(mapFnFactory(query), queryOptions, processResponseFactory(function(err, docs){
						if (err){
							cb(err)
						} else {
							processUpdates(docs);
						}
					}, indexOnly));
				} else {
					p.query(mapIdFnFactory(query), queryOptions, processResponseFactory(function(err, docs){
						if (err){
							cb(err);
						} else {
							processUpdates(docs);
						}
					}, indexOnly));
				}

				function processUpdates(docs){
					if (newAttributes){
						for (var i = 0; i < docs.length; i++){
							var newAttrList = Object.keys(newAttributes);
							for (var j = 0; j < newAttrList.length; j++){
								docs[i][newAttrList[j]] = newAttributes[newAttrList[j]];
							}
						}
						/*docs.forEach(function(currentDoc){
							for (var attName in newAttributes){
								currentDoc[attName] = newAttributes[attName];
							}
						});*/
					} else {
						var inlineAttachment = prepareInlineAttachment(newAttachment);
						for (var i = 0; i < docs.length; i++){
							docs[i]._attachments = inlineAttachment;
						}
						/*docs.forEach(function(currentDoc){
							currentDoc._attachments = inlineAttachment;
						});*/
					}

					p.bulkDocs(docs, function(err, res){
						if (err){
							cb(err);
							return;
						}

						var updatedDocsCount = 0;
						for (var i = 0; i < res.length; i++){
							if (res[i].ok){
								updatedDocsCount++;
							} else {
								console.log('Cannot be updated: ' + JSON.stringify(res[i]));
							}
						}

						cb(undefined, updatedDocsCount);
					});
				}
			}
		}

		function removeFn(p, forceTypeTests){
			return function(q, cb){
				if (forceTypeTests){
					if (!(typeof q == 'object' || typeof q == 'string')) throw new TypeError('query must either be an object or a string');
					if (typeof cb != 'function') throw new TypeError('cb must be a function');
				}

				var queryOptions = {include_docs: true, attachments: true};

				if (typeof q == 'object'){
					p.query(mapFnFactory(q), queryOptions, processResponseFactory(function(err, docs){
						if (err){
							cb(err)
						} else {
							processRemovals(docs);
						}
					}, indexOnly));
				} else {
					p.query(mapIdFnFactory(q), queryOptions, processResponseFactory(function(err, docs){
						if (err){
							cb(err);
						} else {
							processRemovals(docs);
						}
					}, indexOnly));
				}

				function processRemovals(docs){
					for (var i = 0; i < docs.length; i++){
						docs[i]._deleted = true;
					}
					/*docs.forEach(function(currentDoc){
						currentDoc._deleted = true;
					});*/

					p.bulkDocs(docs, function(err, res){
						if (err){
							cb(err);
							return;
						}
					});

					var deletedDocsCount = 0;
					for (var i = 0; i < res.length; i++){
						if (res[i].ok){
							deletedDocsCount++;
						} else {
							console.log('Cannot be deleted: ' + JSON.stringify(res[i]));
						}
					}

					cb(undefined, deletedDocsCount);
				}
			}
		}

		function clearAllFn(p, currentPouchInstances, currentPouchWrappers){
			return function(cb){
				if (typeof cb != 'function') throw new TypeError('cb must be a function');

				p.destroy(function(err, info){
					delete currentPouchInstances[dbName];
					delete currentPouchWrappers[dbName];

					cb(err, info);
				});
			}
		}
	};

	LawncipherDrivers.clearPouch = function(cb){
		if (typeof cb != 'function') throw new TypeError('cb must be a function');

		var currentInstances = Object.keys(pouchInstances);

		var errors = [];
		var delIndex = 0;

		function deleteOne(){
			var currentPName = currentInstances[delIndex];

			var currentP = pouchInstances[currentPName];

			delete pouchWrappers[currentPName];

			currentP.destroy(function(err){
				if (err) errors.push(err);

				delete pouchInstances[currentPName];

				next();
			});
		}

		function next(){
			delIndex++;
			if (delIndex == currentInstances.length){
				cb(errors.length > 0 ? errors : undefined);
			} else {
				deleteOne();
			}
		}

		deleteOne();
	};

})(window.LawncipherDrivers = window.LawncipherDrivers || {}, window);
