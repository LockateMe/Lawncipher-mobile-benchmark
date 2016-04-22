function DBWrapper(dbNameS, /*setupFn,*/ getFn, findFn, findOneFn, saveFn, bulkSaveFn, updateFn, removeFn, /*saveBlobFn, bulkSaveBlobFn,*/ clearAllFn, rawDbObj){
	if (typeof dbNameS != 'string') throw new TypeError('dbNameS must be a string');
	//if (typeof setupFn != 'function') throw new TypeError('setupFn must be a function');
	if (typeof getFn != 'function') throw new TypeError('getFn must be a function');
	if (typeof findFn != 'function') throw new TypeError('findFn must be a function');
	if (typeof findOneFn != 'function') throw new TypeError('findOneFn must be a function');
	if (typeof saveFn != 'function') throw new TypeError('saveFn must be a function');
	if (typeof bulkSaveFn != 'function') throw new TypeError('bulkSaveFn must be a function');
	if (typeof updateFn != 'function') throw new TypeError('updateFn must be a function');
	if (typeof removeFn != 'function') throw new TypeError('removeFn must be a function');
	//if (typeof saveBlobFn != 'function') throw new TypeError('saveBlobFn must be a function');
	//if (typeof bulkSaveBlobFn != 'function') throw new TypeError('bulkSaveBlobFn must be a function');
	if (typeof clearAllFn != 'function') throw new TypeError('clearAllFn must be a function');
	if (typeof rawDbObj != 'object') throw new TypeError('rawDbObj must be an object');

	// One Db wrapper will be instanciated for every DB that we benchmark
	this.dbName = dbNameS;
	//this.setup = setupFn;

	/**
	* Get a single document from its ID
	* @function
	* @param {String} docId
	* @param {Function} cb(err, doc)
	*/
	this.get = getFn;

	/**
	* Find documents from a collection
	* @function
	* @param {Object|String} query|docId
	* @param {Function} callback(err, results)
	* @param {Number} [limit]
	*/
	this.find = findFn;

	/**
	* Find a single document from a collection
	* @function
	* @param {Object|String} query|docId
	* @param {Function} callback(err, results)
	*/
	this.findOne = findOneFn;

	/**
	* Save a single document
	* @function
	* @param {Object} document
	* @param {Uint8Array|Object|String} attachement
	* @param {Function} callback(err, docId)
	*/
	this.save = saveFn;

	/**
	* Save documents, in bulk
	* @function
	* @param {Object[]} documents
	* @param {Uint8Array|Object|String[]} attachements
	* @param {Function} callback(err, docIds)
	*/
	this.bulkSave = bulkSaveFn;

	/**
	* Update documents matching a given query
	* @function
	* @param {Object|String} query|docId
	* @param {Object} newAttributes
	* @param {Uint8Array|Object|String} newAttachement
	* @param {Function} callback(err, updatedCount)
	*/
	this.update = updateFn;

	/**
	* Remove documents matching the given ID or query
	* @function
	* @param {Object|String} query|docId
	* @param {Function} callback(err)
	*/
	this.remove = removeFn;

	/**
	*
	*/
	//this.saveBlob = saveBlobFn;
	//this.bulkSaveBlobFn = bulkSaveBlobFn;

	/**
	* Clear the entire collection
	* @function
	* @param {Function} callback(err)
	*/
	this.clearAll = clearAllFn;

	/**
	* @property {Object} - the underlying DB/Collection object
	*/
	this.rawDb = rawDbObj;
}

function checkDBWrapperArray(a, name){
	name = name || 'dbWrappers';
	if (!(Array.isArray(a) && a.length > 0)) throw new TypeError(name + ' must be a non-empty array');
	a.forEach(function(item, index){
		if (!(item instanceof DBWrapper)) throw new TypeError(name + '[' + index + '] must be an instance of DBWrapper');
	});
}
