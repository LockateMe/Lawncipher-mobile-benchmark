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

			return function matchQuery(d, emit){
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

				emit(d);
			}
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

				if (typeof q == 'object'){
					var queryOptions = {};
					if (limit) queryOptions.limit = limit;
					if (q['$skip']) queryOptions.skip = q['$skip'];

					p.query(mapFnFactory(q), queryOptions, function(err, resultSet){

					});
				} else { //typeof q == 'string'. Fetch by Id

				}

				c.find(q, cb, limit);
			}
		}
	};

	LawncipherDrivers.clearPouch = function(cb){

	};

})(window.LawncipherDrivers = window.LawncipherDrivers || {}, window);
