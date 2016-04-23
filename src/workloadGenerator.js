function WorkloadGenerator(dbWrappers, _workloadOptions){
	checkDBWrapperArray(dbWrappers);

	if (_workloadOptions && typeof _workloadOptions != 'object') throw new TypeError('when defined, _workloadOptions must be an object');

	var workloadOptionsDefaults = {
		fieldCount: 10,
		fieldSize: 100,
		docCount: 5000
	};

	var workloadOptions = {};
	//Shallow copy of _workloadOptions
	for (var propName in _workloadOptions){
		workloadOptions[propName] = _workloadOptions[propName];
	}
	//Using workloadOptionsDefaults for undefined mandatory parameters
	for (var propName in workloadOptionsDefaults){
		workloadOptions[propName] = workloadOptions[propName] || workloadOptionsDefaults[propName];
	}

	function generateFunctionFactory(){
		return function(){}
	}
}
