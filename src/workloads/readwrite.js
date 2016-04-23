function ReadWriteWorkload(dbWrappers){

	/*
	* Workload idea from YCSB : workload A, 50% reads & 50% updates
	*/

	checkDBWrapperArray(dbWrappers);

	var dataList = [];

	function genFunction(cb){
		if (typeof cb != 'function') throw new TypeError('cb must be a callback function');

	}

	function generateOne(){

	}

	function runFunction(dbWrappers, cb){
		if (!(dbWrapper instanceof DBWrapper)) throw new TypeError('dbWrapper must be an instanceof of DBWrapper');
		if (typeof cb != 'function') throw new TypeError('cb must be a callback function, receiving (err, timeElapsedInMs)');
	}

}
