(function(LawncipherDrivers, window){

	var Lawncipher = window.Lawncipher;
	var db;
	var fs;

	var lawncipherRoot = 'lc-benchmark';
	var loadedCollections = {};
	var loadedWrappers = {};

	var idToLawncipherTranslationIndexes = {};
	var lawncipherToIdTranslationIndexes = {};

	var forceTypeTests;

	LawncipherDrivers.initLawncipher = function(dbName, callback, indexModel){
		if (!(typeof dbName == 'string' && dbName.length > 0)) throw new TypeError('dbName must be a non-empty string');
		if (typeof callback != 'function') throw new TypeError('callback must be a function');

		if (indexModel && typeof indexModel != 'object') throw new TypeError('when defined, indexModel must be an object');

		forceTypeTests = typeof window.forceTypeTests == 'boolean' ? window.forceTypeTests : true;

		//In case an indexModel is used, translastion indices will be redundant
		if (!indexModel){
			//Make these defined only if no indexModel is used (and hence id translation is necessary)
			idToLawncipherTranslationIndexes[dbName] = {};
			lawncipherToIdTranslationIndexes[dbName] = {};
		}

		if (!fs) initFS();
		else initDB();

		function initFS(){
			window.plugins.nodefs.init(function(err){
				if (err){
					callback(err);
					return;
				}

				fs = window.plugins.nodefs(window._fs);

				Lawncipher.useCordovaPluginScrypt();

				initDB();
			});
		}

		function initDB(){
			if (!db){
				db = new Lawncipher.db(lawncipherRoot, fs);
				db.openWithPassword('password', function(err){
					if (err){
						callback(err);
						return;
					}

					loadCollection();
				});
			} else loadCollection();
		}

		function loadCollection(){
			if (loadedWrappers[dbName]){
				callback(undefined, loadedWrappers[dbName]);
			} else {
				db.collection(dbName, indexModel, function(err, c){
					if (err){
						callback(err);
						return;
					}

					loadedCollections[dbName] = c;

					//Build wrapper here and return it
					var dbName = 'lawncipher';

					function getFn(c, forceTypeTests, idToLawncipher){
						return function(id, cb){
							if (forceTypeTests){
								if (typeof id != 'string') throw new TypeError('id must be a string');
								if (typeof cb != 'function') throw new TypeError('cb must be a function');
							}

							c.findOne((idToLawncipher && idToLawncipher[id]) || id, cb);
						}
					}

					/*var getFn = function(id, cb){
						if (forceTypeTests){
							if (typeof id != 'string') throw new TypeError('id must be a string');
							if (typeof cb != 'function') throw new TypeError('cb must be a function');
						}

						c.findOne(id, cb);
					};*/

					function findFn(c, forceTypeTests, idToLawncipher){
						return function(q, cb, limit){
							if (forceTypeTests){
								if (!(typeof q == 'object' || typeof q == 'string')) throw new TypeError('q must either be a string (docId) or an object (compound query)');
								if (typeof cb != 'function') throw new TypeError('cb must be a function');
								if (limit && !(typeof limit == 'number' && Math.floor(limit) == limit && limit > 0)) throw new TypeError('when defined, limit must be a strictly positive integer number');
							}

							if (idToLawncipher && typeof q == 'string') q = idToLawncipher[q];

							c.find(q, cb, limit);
						}
					}

					/*var findFn = function(q, cb, limit){
						if (forceTypeTests){
							if (!(typeof q == 'object' || typeof q == 'string')) throw new TypeError('q must either be a string (docId) or an object (compound query)');
							if (typeof cb != 'function') throw new TypeError('cb must be a function');
							if (limit && !(typeof limit == 'number' && Math.floor(limit) == limit && limit > 0)) throw new TypeError('when defined, limit must be a strictly positive integer number');
						}

						c.find(q, cb, limit);
					};*/

					function findOneFn(c, forceTypeTests, idToLawncipher){
						return function(q, cb){
							if (forceTypeTests){
								if (!(typeof q == 'string' || typeof q == 'object')) throw new TypeError('q must either be a string (docId) or an object (compound query)');
								if (typeof cb != 'function') throw new TypeError('cb must be a function');
							}

							if (idToLawncipher && typeof q == 'string') q = idToLawncipher[q];

							c.findOne(q, cb);
						}
					}

					/*var findOneFn = function(q, cb){
						if (forceTypeTests){
							if (!(typeof q == 'string' || typeof q == 'object')) throw new TypeError('q must either be a string (docId) or an object (compound query)');
							if (typeof cb != 'function') throw new TypeError('cb must be a function');
						}

						c.findOne(q, cb);
					};*/

					function saveFn(c, forceTypeTests, idToLawncipher, lawncipherToId){
						return function(doc, attachment, cb, _attachmentId){
							if (forceTypeTests){
								if (!(doc || attachment)) throw new TypeError('either doc or attachment must be defined');
								if (doc && typeof doc != 'object') throw new TypeError('when defined, doc must be an object');
								if (attachment && !(attachment instanceof Uint8Array || typeof attachment == 'object' || typeof attachment == 'string')) throw new TypeError('when defined, attachment must either be a Uint8Array, an object or a string');
								if (typeof cb != 'function') throw new TypeError('cb must be a function');
								if (_attachmentId && typeof _attachmentId != 'string') throw new TypeError('when defined, _attachmentId must be a string');
							}

							c.save(attachment, doc, function(err, docId){
								if (err){
									cb(err);
									return;
								}

								if (doc && lawncipherToId && idToLawncipher){
									lawncipherToId[docId] = doc._id;
									idToLawncipher[doc._id] = docId;
								} else if (attachment && _attachmentId && lawncipherToId && idToLawncipher){
									lawncipherToId[docId] = _attachmentId;
									idToLawncipher[_attachmentId] = docId;
								}
								cb(undefined, doc._id);
							});
						}
					}

					/*var saveFn = function(doc, attachment, cb){
						if (forceTypeTests){
							if (!(doc || attachment)) throw new TypeError('either doc or attachment must be defined');
							if (doc && typeof doc != 'object') throw new TypeError('when defined, doc must be an object');
							if (attachment && !(attachment instanceof Uint8Array || typeof attachment == 'object' || typeof attachment == 'string')) throw new TypeError('when defined, attachment must either be a Uint8Array, an object or a string');
							if (typeof cb != 'function') throw new TypeError('cb must be a function');
						}

						c.save(attachment, doc, cb);
					};*/

					function bulkSaveFn(c, forceTypeTests, idToLawncipher, lawncipherToId){
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

							c.bulkSave(attachments, docs, function(err, docIds){
								if (err){
									cb(err);
									return;
								}

								var translatedIds = new Array(docIds.length);
								for (var i = 0; i < docsIds.length; i++){
									//For each inserted doc/attachment (and returned id), check whether it's a doc or an attachement
									//Add the corresponding id to the index
									var currentProvidedDocId = (docs && docs[i] && docs[i]._id) || (attachments && attachments[i] && attachmentsIds[i]);
									var currentLawncipherDocId = docsIds[i];
									if (!currentProvidedDocId){
										throw 'Cannot find docId at index ' + i + '\nDoc: ' + JSON.stringify(docs[i]) + '\nAttachment: ' + JSON.stringify(attachments[i]);
									}

									lawncipherToId[currentLawncipherDocId] = currentProvidedDocId;
									idToLawncipher[currentProvidedDocId] = currentLawncipherDocId;
									translatedIds[i] = currentProvidedDocId;
								}

								/*if (idToLawncipher && lawncipherToId){
									if (docs && docs.length > 0){
										docs.forEach(function(currentDoc, index){
											lawncipherToId[docIds[index]] = currentDoc._id;
											idToLawncipher[currentDoc._id] = docIds[index];
											translatedIds[index] = currentDoc._id;
										});
									} else if (attachments.length > 0 && attachmentsIds.length > 0 && attachments.length == attachmentsIds.length){
										attachments
									}
								}*/

								/*if (docs && docs.length > 0 && idToLawncipher && lawncipherToId){
									docs.forEach(function(currentDoc, index){
										lawncipherToId[docIds[index]] = currentDoc._id;
										idToLawncipher[currentDoc._id] = docIds[index];
										translatedIds[index] = currentDoc._id;
									});
								}*/

								cb(undefined, translatedIds);
							});
						}
					}

					/*var bulkSaveFn = function(docs, attachments, cb){
						if (forceTypeTests){
							if (!(docs || attachments)) throw new TypeError('either docs or attachments must be defined');
							if (docs && !(Array.isArray(docs) && docs.length > 0)) throw new TypeError('when defined, docs must be a non-empty array');
							if (attachments && !(Array.isArray(attachments) && attachments.length > 0)) throw new TypeError('when defined, attachments must be a non-empty array');
							if (docs && attachments && !(docs.length == attachments.length)) throw new TypeError('when both docs attachments are provided, they must have the same length');
							if (typeof cb != 'function') throw new TypeError('cb must be a function');
						}

						c.bulkSave(attachments, docs, cb);
					};*/

					function updateFn(c, forceTypeTests, idToLawncipher){
						return function(query, newAttributes, newAttachment, cb, indexOnly){
							if (forceTypeTests){
								if (!(typeof query == 'string' || typeof query == 'object')) throw new TypeError('query must be either a string or an object');
								if (!(newAttributes || newAttachment)) throw new TypeError('either newAttributes or newAttachment must be defined');
								if (newAttributes && newAttachment) throw new TypeError('newAttributes and newAttachment cannot be defined at the same time');
								if (newAttributes && typeof newAttributes != 'object') throw new TypeError('when defined, newAttributes must be an object');
								if (newAttachment && !((newAttachment instanceof Uint8Array) || typeof newAttachment == 'object' || typeof newAttachment == 'string')) throw new TypeError('when defined, newAttachment must be either a Uint8Array, a string or an object');
								if (typeof cb != 'function') throw new TypeError('cb must be a function');
							}

							if (idToLawncipher && typeof query == 'string'){ //Translate id to lawncipherId
								query = idToLawncipher[query];
							}

							c.update(query, newAttributes || newAttachment, cb, indexOnly);
						}
					}

					/*var updateFn = function(query, newAttributes, newAttachment, cb){
						if (forceTypeTests){
							if (!(typeof query == 'string' || typeof query == 'object')) throw new TypeError('query must be either a string or an object');
							if (!(newAttributes || newAttachment)) throw new TypeError('either newAttributes or newAttachment must be defined');
							if (newAttributes && typeof newAttributes != 'object') throw new TypeError('when defined, newAttributes must be an object');
							if (newAttachment && !((newAttachment instanceof Uint8Array) || typeof newAttachment == 'object' || typeof newAttachment == 'string')) throw new TypeError('when defined, newAttachment must be either a Uint8Array, a string or an object');
							if (typeof cb != 'function') throw new TypeError('cb must be a function');
						}

						c.update(query, newAttributes || newAttachment, cb);
					};*/

					function removeFn(c, forceTypeTests, idToLawncipher){
						return function(q, cb){
							if (forceTypeTests){
								if (!(typeof q == 'object' || typeof q == 'string')) throw new TypeError('query must either be an object or a string');
								if (typeof cb != 'function') throw new TypeError('cb must be a function');
							}

							if (idToLawncipher && typeof q == 'string'){
								q = idToLawncipher[q];
							}

							c.remove(q, cb);
						}
					}

					/*var removeFn = function(q, cb){
						if (forceTypeTests){
							if (!(typeof q == 'object' || typeof q == 'string')) throw new TypeError('query must either be an object or a string');
							if (typeof cb != 'function') throw new TypeError('cb must be a function');
						}

						c.remove(q, cb);
					};*/

					function clearAllFn(c, db, idToLawncipherTranslationIndexes, lawncipherToIdTranslationIndexes){
						return function(cb){
							if (typeof cb != 'function') throw new TypeError('cb must be a function');

							c.close();

							db.dropCollection(dbName, function(err){
								if (err){
									cb(err);
									return;
								}

								delete loadedCollections[dbName];
								if (idToLawncipherTranslationIndexes[dbName]) delete idToLawncipherTranslationIndexes[dbName];
								if (lawncipherToIdTranslationIndexes[dbName]) delete lawncipherToIdTranslationIndexes[dbName];

								cb();
							});
						}
					}

					/*var clearAllFn = function(cb){
						if (typeof cb != 'function') throw new TypeError('cb must be a function');

						c.close();

						db.dropCollection(dbName, function(err){
							if (err){
								cb(err);
								return;
							}

							delete loadedCollections[dbName];
							cb();
						});
					};*/

					var lcWrapper = new DBWrapper(
						'Lawncipher',
						getFn(c, forceTypeTests, idToLawncipherTranslationIndexes[dbName]),
						findFn(c, forceTypeTests, idToLawncipherTranslationIndexes[dbName]),
						findOneFn(c, forceTypeTests, idToLawncipherTranslationIndexes[dbName]),
						saveFn(c, forceTypeTests, idToLawncipherTranslationIndexes[dbName], lawncipherToIdTranslationIndexes[dbName]),
						bulkSaveFn(c, forceTypeTests, idToLawncipherTranslationIndexes[dbName], lawncipherToIdTranslationIndexes[dbName]),
						updateFn(c, forceTypeTests, idToLawncipherTranslationIndexes[dbName]),
						removeFn(c, forceTypeTests, idToLawncipherTranslationIndexes[dbName]),
						clearAllFn(c, db, idToLawncipherTranslationIndexes, lawncipherToIdTranslationIndexes),
						c //Raw collection object
					);

					loadedWrappers[dbName] = lcWrapper;

					LawncipherDrivers.lawncipherInstances = loadedCollections;
					LawncipherDrivers.lawncipherWrappers = loadedWrappers;

					callback(undefined, lcWrapper);
				});
			}
		}

	};

	LawncipherDrivers.clearLawncipher = function(cb){
		if (typeof cb != 'function') throw new TypeError('cb must be a function');

		if (!(fs && db)){
			cb();
			return;
		}

		for (var colName in loadedCollections){
			loadedCollections[colName].close();
			delete loadedCollections[colName];
			delete loadedWrappers[colName];
			delete idToLawncipherTranslationIndexes[colName];
			delete lawncipherToIdTranslationIndexes[colName];
		}

		db.close();
		fs.rmdirr(lawncipherRoot, cb);
	};

})(window.LawncipherDrivers = window.LawncipherDrivers || {}, window);
