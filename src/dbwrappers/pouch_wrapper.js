(function(LawncipherDrivers, window){

	var PouchDB = window.PouchDB;
	var pouchInstances = {};
	var pouchWrappers = {};

	var forceTypeTests;

	LawncipherDrivers.initPouch = function(dbName, callback, adapter){
		if (!(typeof dbName == 'string' && dbName.length > 0)) throw new TypeError('dbName must be a non-empty string');
		if (typeof callback != 'function') throw new TypeError('callback must be a function');

		if (adapter && typeof adapter != 'string') throw new TypeError('when defined, adapter must be a string');
		adapter = adapter || 'websql';

		var pInstance = new PouchDB(dbName, {adapter: adapter});
		pouchInstances[dbName] = pInstance;

		forceTypeTests = typeof window.forceTypeTests == 'boolean' ? window.forceTypeTests : true;

		function mapFnFactory(q){
			//Shallow copy of query, ignoring lawncipher-specific query operators
			var query = {};
			for (var queryPartName in q){
				if (queryPartName.indexOf('$') == 0) continue;
				query[queryPartName] = q[queryPartName];
			}
			var queryParts = Object.keys(query);

			return function(d, emit){
				for (var i = 0; i < queryParts.length; i++){
					var dValue = doc[queryParts[i]], qValue = query[queryParts[i]];
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

		function processResponseFactory(_cb){
			return function(err, dbResponse){
				if (err){
					_cb(err);
					return;
				}

				var resultSet = dbResponse.rows;
				var attachementsFirstRs = new Array(resultSet.length);

				var firedCbs = 0;

				function endOne(){
					firedCbs++;
					if (firedCbs == resultSet.length){
						_cb(undefined, attachementsFirstRs);
					}
				}

				for (var i = 0; i < resultSet.length; i++){
					var attList = resultSet[i]._attachements && Object.keys(_attachements)
					if (attList && attList.length > 0){
						var theAttachement = resultSet[i]._attachements[attList[0]];
						//var aType = theAttachement.content_type;
						//if (content_type.indexOf('text') != -1) attachementsFirstRs.push(theAttachement.data);
						//if (content_type.indexOf('json') != -1) attachementsFirstRs.push(JSON.parse(theAttachement.data));
						processResponseBlob(theAttachement, i, attachementsFirstRs, function(_pErr){
							if (_pErr){
								_cb(_pErr);
								return;
							}

							endOne();
						});
					} else {
						attachementsFirstRs[i] = resultSet[i];
						endOne();
					}
				}

				_cb(undefined, attachementsFirstRs);
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

		function getFn(p, forceTypeTests){
			return function(id, cb){
				if (forceTypeTests){
					if (typeof id != 'string') throw new TypeError('id must be a string');
					if (typeof cb != 'function') throw new TypeError('cb must be a function');
				}

				p.get(id, {attachements: true}, function(err, doc){
					if (err){
						cb(err);
						return;
					}

					if (doc._attachements){
						console.log('attachements of doc ' + id);
						console.log(JSON.stringify(doc._attachements));
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

				var queryOptions = {include_docs: true, attachements: true};

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

				var queryOptions = {include_docs: true, attachements: true, limit: 1};

				if (typeof q == 'object'){
					p.query(mapFnFactory(q), queryOptions)
				} else {

				}
			}
		}
	};

	LawncipherDrivers.clearPouch = function(cb){

	};

})(window.LawncipherDrivers = window.LawncipherDrivers || {}, window);
