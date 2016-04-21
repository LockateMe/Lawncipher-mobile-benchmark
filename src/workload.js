function Workload(generateFunction, runnerFunction, name){
	if (typeof generateFunction != 'function') throw new TypeError('generateFunction must be a function');
	if (typeof runnerFunction != 'function') throw new TypeError('runnerFunction must be a function');
	if (typeof name != 'string') throw new TypeError('name must be a string');

	/**
	* generateFunction([Function cb])
	* runnerFunction(Object dbMethodsWrappers | DBWrapper dbwInstance)
	* Where dbMethodsWrappers contain
	* - find
	* - findOne
	* - save
	* - bulkSave
	* - update
	* - remove
	*/

	this._generateFunction = generateFunction;
	this._runnerFunction = runnerFunction;
	this._name = name;

}
