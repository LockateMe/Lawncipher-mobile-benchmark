function Workload(dbWrappers, generateFunction, runnerFunction, name){
	checkDBWrapperArray(dbWrappers);

	if (typeof generateFunction != 'function') throw new TypeError('generateFunction must be a function');
	if (typeof runnerFunction != 'function') throw new TypeError('runnerFunction must be a function');
	if (typeof name != 'string') throw new TypeError('name must be a string');

	/**
	* Array<DBWrapper> dbWrappers
	* generateFunction(Array<DBWrapper> dbWrappers, Function cb)
	* runnerFunction(Array<DBWrapper> dbWrappers, Function cb)
	* String workloadName
	*/

	this._dbDrivers = dbWrappers;
	this._generateFunction = generateFunction;
	this._runnerFunction = runnerFunction;
	this._name = name;

	this.run = function(callback){
		if (typeof callback != 'function') throw new TypeError('callback must be a function');

		var results = {};

		var runIndex = 0;
		var results = {};

		function runOnce(){
			runnerFunction(dbWrappers, function(err){
				if (err){
					callback(err);
					return;
				}

				runNext();
			});
		}

		function runNext(){
			runIndex++;

			if (runIndex == dbWrappers){

			}
		}
	}

}
