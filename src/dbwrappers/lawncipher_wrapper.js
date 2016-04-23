(function(LawncipherDrivers, window){

	var Lawncipher = window.Lawncipher;
	var db;
	var fs;

	var lawncipherRoot = 'lc-benchmark';
	var loadedCollections = {};
	var loadedWrappers = {};

	var forceTypeTests;

	LawncipherDrivers.initLawncipher = function(dbName, callback, indexModel){
		if (!(typeof dbName == 'string' && dbName.length > 0)) throw new TypeError('dbName must be a non-empty string');
		if (typeof callback != 'function') throw new TypeError('callback must be a function');

		if (indexModel && typeof indexModel != 'object') throw new TypeError('when defined, indexModel must be an object');

		forceTypeTests = typeof window.forceTypeTests == 'boolean' ? window.forceTypeTests : true;

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

					function getFn(c, forceTypeTests){
						return function(id, cb){
							if (forceTypeTests){
								if (typeof id != 'string') throw new TypeError('id must be a string');
								if (typeof cb != 'function') throw new TypeError('cb must be a function');
							}

							c.findOne(id, cb);
						}
					}

					/*var getFn = function(id, cb){
						if (forceTypeTests){
							if (typeof id != 'string') throw new TypeError('id must be a string');
							if (typeof cb != 'function') throw new TypeError('cb must be a function');
						}

						c.findOne(id, cb);
					};*/

					function findFn(c, forceTypeTests){
						return function(q, cb, limit){
							if (forceTypeTests){
								if (!(typeof q == 'object' || typeof q == 'string')) throw new TypeError('q must either be a string (docId) or an object (compound query)');
								if (typeof cb != 'function') throw new TypeError('cb must be a function');
								if (limit && !(typeof limit == 'number' && Math.floor(limit) == limit && limit > 0)) throw new TypeError('when defined, limit must be a strictly positive integer number');
							}

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

					function findOneFn(c, forceTypeTests){
						return function(q, cb){
							if (forceTypeTests){
								if (!(typeof q == 'string' || typeof q == 'object')) throw new TypeError('q must either be a string (docId) or an object (compound query)');
								if (typeof cb != 'function') throw new TypeError('cb must be a function');
							}

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

					function saveFn(c, forceTypeTests){
						return function(doc, attachment, cb){
							if (forceTypeTests){
								if (!(doc || attachment)) throw new TypeError('either doc or attachment must be defined');
								if (doc && typeof doc != 'object') throw new TypeError('when defined, doc must be an object');
								if (attachment && !(attachment instanceof Uint8Array || typeof attachment == 'object' || typeof attachment == 'string')) throw new TypeError('when defined, attachment must either be a Uint8Array, an object or a string');
								if (typeof cb != 'function') throw new TypeError('cb must be a function');
							}

							c.save(attachment, doc, cb);
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

					function bulkSaveFn(c, forceTypeTests){
						return function(docs, attachments, cb){
							if (forceTypeTests){
								if (!(docs || attachments)) throw new TypeError('either docs or attachments must be defined');
								if (docs && !(Array.isArray(docs) && docs.length > 0)) throw new TypeError('when defined, docs must be a non-empty array');
								if (attachments && !(Array.isArray(attachments) && attachments.length > 0)) throw new TypeError('when defined, attachments must be a non-empty array');
								if (docs && attachments && !(docs.length == attachments.length)) throw new TypeError('when both docs attachments are provided, they must have the same length');
								if (typeof cb != 'function') throw new TypeError('cb must be a function');
							}

							c.bulkSave(attachments, docs, cb);
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

					function updateFn(c, forceTypeTests){
						return function(query, newAttributes, newAttachment, cb){
							if (forceTypeTests){
								if (!(typeof query == 'string' || typeof query == 'object')) throw new TypeError('query must be either a string or an object');
								if (!(newAttributes || newAttachment)) throw new TypeError('either newAttributes or newAttachment must be defined');
								if (newAttributes && typeof newAttributes != 'object') throw new TypeError('when defined, newAttributes must be an object');
								if (newAttachment && !((newAttachment instanceof Uint8Array) || typeof newAttachment == 'object' || typeof newAttachment == 'string')) throw new TypeError('when defined, newAttachment must be either a Uint8Array, a string or an object');
								if (typeof cb != 'function') throw new TypeError('cb must be a function');
							}

							c.update(query, newAttributes || newAttachment, cb);
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

					function removeFn(c, forceTypeTests){
						return function(q, cb){
							if (forceTypeTests){
								if (!(typeof q == 'object' || typeof q == 'string')) throw new TypeError('query must either be an object or a string');
								if (typeof cb != 'function') throw new TypeError('cb must be a function');
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

					function clearAllFn(c, db){
						return function(cb){
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
						getFn(c, forceTypeTests),
						findFn(c, forceTypeTests),
						findOneFn(c, forceTypeTests),
						saveFn(c, forceTypeTests),
						bulkSaveFn(c, forceTypeTests),
						updateFn(c, forceTypeTests),
						removeFn(c, forceTypeTests),
						clearAllFn(c, db),
						c //Raw collection object
					);

					loadedWrappers[dbName] = lcWrapper;

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
		}

		db.close();
		fs.rmdirr(lawncipherRoot, cb);
	};

})(window.LawncipherDrivers = window.LawncipherDrivers || {}, window);
