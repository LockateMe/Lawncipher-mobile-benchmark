function Workload(dbWrappers, generateFunction, runnerFunction, name){
	if (!(Array.isArray(dbWrappers) && dbWrappers.length > 0)) throw new TypeError('dbWrappers must be an array');
	dbWrappers.forEach(function(item, index){
		if (!(item instanceof DBWrapper)) throw new TypeError('dbWrappers[' + index + '] must be an instance of DBWrapper');
	});

	if (typeof generateFunction != 'function') throw new TypeError('generateFunction must be a function');
	if (typeof runnerFunction != 'function') throw new TypeError('runnerFunction must be a function');
	if (typeof name != 'string') throw new TypeError('name must be a string');

	/**
	* DBWrapper instances
	* generateFunction(Function cb)
	* runnerFunction(Function cb)
	* String workloadName
	*/

	this._dbDrivers = dbWrappers;
	this._generateFunction = generateFunction;
	this._runnerFunction = runnerFunction;
	this._name = name;

}
