function Workload(dbWrappers, _workloadOptions, loadCallback){
	if (!sodium) throw new Error('libsodium cannot be found. Ensure that you are loading libsodium before loading the benchmarking code');

	var from_string = sodium.from_string, to_string = sodium.to_string;
	var from_base64 = sodium.from_base64, to_base64 = sodium.to_base64;
	var from_hex = sodium.from_hex, to_hex = sodium.to_hex;

	dbWrappers = checkDBWrapperArray(dbWrappers, undefined, true);

	//Declaring workload arrays
	var workloadData, workloadOperations, workloadAttachments;
	var workloadCounters = {
		read: 0,
		update: 0,
		insert: 0,
		query: 0
	};

	var drivers = ['Lawncipher', 'Pouch'];
	var initCompleted = false;

	if (_workloadOptions && typeof _workloadOptions != 'object') throw new TypeError('when defined, _workloadOptions must be an object');
	if (typeof loadCallback != 'function') throw new TypeError('loadCallback must be a function');

	var workloadOptionsDefaults = {
		fieldCount: 10,
		fieldSize: 100,
		docCount: 5000,
		operationCount: 5000,
		generateId: true,
		insertData: true,
		useAttachments: false,
		useIndexModel: false,
		indexModel: null, //An object (when defined)
		queryAttributes: null, //An array (when defined)
		shuffleWorkloads: true,
		pouchAdapter: 'websql',
		proportions: {
			read: 0, //Read by Id
			update: 0, //Update by id or query?
			insert: 0, //Insert by id or query?
			query: 0 //Advanced/compound search query
		},
		name: 'Unnamed Workload'
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

	var totalProportions;
	var indexModel;
	var fieldNames, fieldNamesCount, fieldNameLength;

	function initWorkload(){
		//Sizing/allocating workload arrays
		workloadData = new Array(workloadOptions.docCount);
		workloadAttachments = new Array(workloadOptions.useAttachments ? workloadOptions.docCount : 0);
		workloadOperations = new Array(workloadOptions.operationCount);

		//Checking proportions integrity
		totalProportions =
			workloadOptions.proportions.read +
			workloadOptions.proportions.update +
			workloadOptions.proportions.insert +
			workloadOptions.proportions.query;

		if (totalProportions != 1){
			throw new TypeError('Invalid proportions sum:' + totalProportions);
		}

		if (workloadOptions.useIndexModel && !(workloadOptions.fieldNames && workloadOptions.fieldNames.length > 0)){
			indexModel = {};
			fieldNames = new Array(workloadOptions.fieldCount);
			fieldNamesCount = 0;

			fieldNameLength = Math.ceil(Math.log2(workloadOptions.fieldCount)) + 1;

			if (workloadOptions.generateId){
				fieldNames[fieldNamesCount] = '_id';
				fieldNamesCount++;
			}

			while (fieldNamesCount < workloadOptions.fieldCount){
				fieldNames[fieldNamesCount] = generateString(fieldNameLength);
				fieldNamesCount++;
			}

			fieldNames.forEach(function(item){
				if (item == '_id'){
					indexModel['_id'] = {id: true, type: 'string'};
				} else {
					indexModel[item] = 'string';
				}
			});

			workloadOptions.fieldNames = fieldNames;
			workloadOptions.indexModel = indexModel;
		}
	}

	function initDrivers(_cb){
		var initIndex = 0;

		function initOne(){
			var currentDb = drivers[initIndex];
			var currentInitFnName = 'init' + currentDb;
			var thirdParam;
			if (currentDb == 'Pouch'){
				thirdParam = workloadOptions.pouchAdapter;
			} else if (currentDb == 'Lawncipher'){
				thirdParam = workloadOptions.indexModel;
			}

			LawncipherDrivers[currentInitFnName](workloadOptions.name, function(err, w){
				if (err){
					_cb(err);
					return;
				}

				dbWrappers.push(w);

				next();
			}, thirdParam);
		}

		function next(){
			initIndex++;
			if (initIndex == drivers.length){
				_cb();
			} else {
				initOne();
			}
		}

		initOne();
	}

	function cleanUp(_cb){
		var clearIndex = 0;

		function cleanOne(){
			var currentDb = drivers[clearIndex];
			var currentClearFnName = 'clear' + currentDb;

			LawncipherDrivers[currentClearFnName](function(err){
				if (err){
					_cb(err);
					return;
				}

				next();
			});
		}

		function next(){
			clearIndex++;

			if (clearIndex == drivers.length){
				_cb();
			} else {
				cleanOne();
			}
		}

		cleanOne();
	}

	if (dbWrappers.length == 0){
		initWorkload();
		initDrivers(function(err){
			if (err){
				loadCallback(err);
				return;
			}

			initCompleted = true;
			loadCallback();
		});
	} else {
		initWorkload();

		initCompleted = true;
		loadCallback();
	}

	/*
	* START : DATA GENERATION FUNCTIONS
	*/

	function generateDoc(){
		//var genFieldsCount = 0;

		var d = {};

		for (var i = 0; i < workloadOptions.fieldNames.length; i++){
			d[workloadOptions.fieldNames[i]] = generateString(workloadOptions.fieldSize);
		}

		/*if (workloadOptions.generateId){
			d._id = generateString(workloadOptions.fieldSize);
			genFieldsCount++;
		}

		while (genFieldsCount < workloadOptions.fieldCount){
			d[generateString(4)] = generateString(workloadOptions.fieldSize);
			genFieldsCount++;
		}*/

		return d;
	}

	function generateUpdateFromDoc(d){
		if (typeof d != 'object') throw new TypeError('d must be an object');

		//var dCopy = {};
		var newAttributes = {};
		var selector = d._id || d;

		//Listing current documents attributes (to see which ones we would modify)
		//Make a shallow copy using this occasion
		var currentAttributes = Object.keys(d);
		for (var i = 0; i < currentAttributes.length; i++){
			//Excluding attributes beginning with an underscore (e.g: _id, _rev, _attachments)
			//dCopy[currentAttributes[i]] = d[currentAttributes[i]];
			if (currentAttributes[i].indexOf('_') == 0) currentAttributes.splice(i, 1);
		}

		//Choosing a number of attributes to modify between [1, numberOfAvailableAttributes]
		var numToModify = 1 + Math.floor(Math.random() * (currentAttributes.length - 1));
		currentAttributes = shuffleList(currentAttributes).slice(0, numToModify);

		for (var i = 0; i < currentAttributes.length; i++){
			newAttributes[currentAttributes[i]] = generateString(workloadOptions.fieldSize);
		}

		return {selector: selector, newAttributes: newAttributes};
	}

	function generateBlob(min, max){ //Generate a blob in the [min, max] range in kilobytes. Defaults to [100, 200]
		min = min || 100;
		max = max || 200;
		var sizeRange = max - min;
		var bKbSize = min + Math.round(Math.random() * sizeRange);
		return generateBuffer(bKbSize * 1024);
	}

	function generateString(length, type){
		type = type || 'hex';

		if (!(typeof length == 'number' && Math.floor(length) == length && length > 0)) throw new TypeError('length must be strictly positive integer number');

		if (!(type == 'hex' || type == 'base64' || type == 'alphanum' || 'raw')){
			throw new TypeError('invalid string type: ' + type);
		}

		if (type == 'hex'){
			return to_hex(generateBuffer(Math.ceil(length / 2))).substr(0, length);
		} else if (type == 'base64'){
			return to_base64(generateBuffer(Math.ceil((3 / 4) * length))).substr(0, length);
		} else if (type == 'alphanum'){
			//Worst case for entropy, but who cares in this case...
			var charset = 'aAbBcCdDeEfFgGhHiIjJkKlLmMnNoOpPqQrRsStTuUvVwWxXyYzZ0123456789';
			var s = '';
			for (var i = 0; i < length; i++) s += charset[Math.floor(Math.random() * charset.length)];
			return s;
		} else {
			return to_string(generateBuffer(length));
		}
	}

	function generateBuffer(length){
		var b = new Uint8Array(length);
		window.crypto.getRandomValues(b);
		return b;
	}

	function shuffleList(a, inPlace){
		if (!(Array.isArray(a) && a.length > 0)) throw new TypeError('a must be a non empty array');

		var o = new Array(a.length);

		a.forEach(function(item, index){
			o[index] = {p: Math.random(), v: item};
		});

		o.sort(function(a, b){
			if (a.p < b.p){
				return -1;
			} else {
				return 1;
			}
		});

		if (inPlace){
			o.forEach(function(item, index){
				a[index] = item;
			});
			return a;
		} else {
			return o.map(function(item){
				return item.v;
			});
		}
	}

	function randomListItem(l){
		if (!Array.isArray(l)) throw new TypeError('l must be an array');
		if (l.length < 2) throw new TypeError('l must contain at least 2 items');

		var itemIndex = Math.floor(Math.random() * l.length);
		return l[itemIndex] || randomListItem(l); //Repeat recursively until the selected item is not null or undefined
	}

	function getNextOperationType(opIndex){
		var nOperations = opIndex + 1; //The n-th operation = its index in the operations array + 1
		var propDistances = {
			read: workloadOptions.proportions.read - workloadCounters.read / nOperations,
			update: workloadOptions.proportions.update - workloadCounters.update / nOperations,
			insert: workloadOptions.proportions.insert - workloadCounters.insert / nOperations,
			query: workloadOptions.proportions.query - workloadCounters.query / nOperations
		};

		var furthestFromTarget = Number.MIN_VALUE;
		var furthestFromTargetAttr;
		for (var p in propDistances){
			//Defaults to an operation type. Just in case...
			if (!furthestFromTargetAttr) furthestFromTargetAttr = p;

			var currentProp = propDistances[p];
			if (currentProp > furthestFromTarget){
				furthestFromTarget = currentProp;
				furthestFromTargetAttr = p;
			}
		}

		var nextOpType = furthestFromTargetAttr;
		workloadCounters[nextOpType]++;

		return nextOpType;
	}

	/*
	* END : DATA GENERATION FUNCTIONS
	*/

	/*
	* START : WORKLOAD FUNCTIONS GENERATION
	*/

	/*function generateFunctionFactory(workloadOptions, dataList, attachmentsList){
		return function(dbWrappers, cb){
			checkDBWrapperArray(dbWrappers);
			if (typeof cb != 'function') throw new TypeError('cb must be a function');

			var aotInsertProportion =  1 - workloadOptions.proportions.insert;
			var aotDocNumber = Math.round(aotInsertProportion * workloadOptions.docCount);

			for (var i = 0; i < aotDocNumber; i++){
				dataList[i] = generateDoc();
			}

			var bulkSaveIndex = 0;

			function bulkSaveOne(){
				dbWrappers[bulkSaveIndex].bulkSave(dataList, attachmentsList, function(err, docsIds){
					if (err){
						cb(err);
						return;
					}

					bulkSaveNext();
				});
			}

			function bulkSaveNext(){
				bulkSaveIndex++;
				if (bulkSaveIndex == dbWrappers.length){
					cb();
				} else {
					bulkSaveOne();
				}
			}

			//Start the bulk insertion loop
			bulkSaveOne();
		}
	}*/

	var generateFunction = function(cb){
		if (!cb) throw 'Missing callback';

		var aotInsertProportion =  1 - workloadOptions.proportions.insert;
		var inWorkloadInserts = workloadOptions.proportions.insert * workloadOptions.operationCount;
		var aotInserts = workloadOptions.docCount - inWorkloadInserts;
		/*
			Which one do we use? Not in all cases will have docCount == operationCount
			We take the minimum between the 2 numbers, to ensure that insert operations do not "monopolize" the workload
		*/
		// THIS SEEMS TO BE A BAD IDEA. THE SOLUTION IS IN THE CODE ABOVE THIS COMMENTED SECTION
		/*
		var aotDocNumberByDocCount = Math.round(aotInsertProportion * workloadOptions.docCount);
		var aotDocNumberByOpCount = Math.round(aotInsertProportion * workloadOptions.operationCount);
		var aotDocNumber = Math.min(aotDocNumberByDocCount, aotDocNumberByOpCount);
		*/

		if (workloadOptions.useAttachments){
			for (var i = 0; i < aotInserts; i++){
				workloadAttachments[i] = generateBlob();
			}
		} else {
			for (var i = 0; i < aotInserts; i++){
				workloadData[i] = generateDoc();
			}
		}

		var bulkSaveIndex = 0;

		function bulkSaveOne(){
			dbWrappers[bulkSaveIndex].bulkSave(workloadData, workloadAttachments, function(err, docsIds){
				if (err){
					cb(err);
					return;
				}

				bulkSaveNext();
			});
		}

		function bulkSaveNext(){
			bulkSaveIndex++;
			if (bulkSaveIndex == dbWrappers.length){
				cb();
			} else {
				bulkSaveOne();
			}
		}

		//Start the bulk insertion loop
		bulkSaveOne();
	};

	var runnerFunction = function(cb){
		if (!cb) throw 'Missing callback';

		var gErrors = {}; //Global errors object
		var results = {}; //Global performance results object
		var wrapperIndex = 0;

		//Prepare queries and what not.
		var numOperations = workloadOperations.length;
		for (var i = 0; i < numOperations; i++){
			var nextOpType = getNextOperationType(i);

			var opParams = {type: nextOpType};
			if (nextOpType == 'read'){
				var randDoc = randomListItem(workloadData);
				//Select by id, but wait...
			} else if (nextOpType == 'update'){

			} else if (nextOpType == 'insert'){
				if (workloadOptions.useAttachments) opParams.attachment = generateBlob();
				else opParams.doc = generateDoc();
			} else if (nextOpType == 'query'){

			} else throw new Error('Invalid operation type: ' + nextOpType);

			workloadOperations[i] = opParams;
		}
		//Generate missing docs (regarding insert proportion)
		//Generate queries based upon existing docs, that are randomly selected from dataList

		//Ensuring proportions balance : current proportions are recalculated at each iteration
		//The type of operation to be scheduled/done in the current iteration is the type that has it's current proportion that furthest from its target proportion

		function runOnce(){
			var bChrono = new Chrono();

			var cWrapper = dbWrappers[wrapperIndex];

			var opIndex = 0;

			function opOne(){

			}

			function nextOp(){
				opIndex++;
				if (opIndex == workloadOperations.length){
					var wDuration = bChrono.stop();
					results[dbWrappers[wrapperIndex].dbType] = wDuration;

					nextDb();
				} else {
					/*
					if (opIndex % 100 == 0) setTimeout(opOne, 0);
					else opOne();
					*/
					opOne();
				}
			}

			bChrono.start();
			opOne();
		}

		function nextDb(){
			wrapperIndex++;
			if (wrapperIndex == dbWrappers.length){
				cb(undefined, results);
			} else {
				runOnce();
			}
		}
	};

	/*function runnerFunctionFactory(workloadOptions, dataList, attachmentsList, operationsList){
		return function(dbWrappers, cb){

			var gErrors = {}; //Global errors object
			var results = {}; //Global performance results object
			var wrapperIndex = 0;

			//Prepare queries and what not.
			var numQueries = operationsList.length;
			for (var i = 0; i < numQueries; i++){
				var nextOpType = getNextOperationType(i);

				if (nextOpType == 'read'){

				} else if (nextOpType == 'update'){

				} else if (nextOpType == 'insert'){

				} else if (nextOpType == 'query'){

				} else {
					throw new Error('Invalid operation type: ' + nextOpType);
				}
			}
			//Generate missing docs (regarding insert proportion)
			//Generate queries based upon existing docs, that are randomly selected from dataList

			//Ensuring proportions balance : current proportions are recalculated at each iteration
			//The type of operation to be scheduled/done in the current iteration is the type that has it's current proportion that furthest from its target proportion

			function runOnce(){
				var bChrono = new Chrono();

			}

			function nextDb(){
				wrapperIndex++;
			}

		}
	}*/

	/*
	* END : WORKLOAD FUNCTIONS GENERATION
	*/

	this.run = function(callback){
		if (!initCompleted) throw new Error('The workload init procedure is not complete yet');
		if (typeof callback != 'function') throw new TypeError('callback must be a function');

		generatorFunction(dbWrappers, function(err){
			if (err){
				callback(err);
				return;
			}

			runnerFunction(dbWrappers, function(r_err, results){
				cleanUp(function(c_err){
					callback(r_err || c_err, results);
				});
			});
		});
	};

	this.name = function(){
		return workloadOptions.name;
	};
}
