function DBWrapper(dbNameS, findFn, findOneFn, saveFn, bulkSaveFn, updateFn, removeFn, clearAllFn){
	if (typeof dbNameS != 'string') throw new TypeError('dbNameS must be a string');
	if (typeof findFn != 'function') throw new TypeError('findFn must be a function');
	if (typeof findOneFn != 'function') throw new TypeError('findOneFn must be a function');
	if (typeof saveFn != 'function') throw new TypeError('saveFn must be a function');
	if (typeof bulkSaveFn != 'function') throw new TypeError('bulkSaveFn must be a function');
	if (typeof updateFn != 'function') throw new TypeError('updateFn must be a function');
	if (typeof removeFn != 'function') throw new TypeError('removeFn must be a function');
	if (typeof clearAllFn != 'function') throw new TypeError('clearAllFn must be a function');

	// One Db wrapper will be instanciated for every DB that we benchmark
	this.dbName = dbNameS;
	this.find = findFn;
	this.findOne = findOneFn;
	this.save = saveFn;
	this.bulkSave = bulkSaveFn;
	this.update = updateFn;
	this.remove = removeFn;
	this.clearAll = clearAllFn;
}
