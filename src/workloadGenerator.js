function Workload(dbWrappers, _workloadOptions, name){
	var from_string = sodium.from_string, to_string = sodium.to_string;
	var from_base64 = sodium.from_base64, to_base64 = sodium.to_base64;
	var from_hex = sodium.from_hex, to_hex = sodium.to_hex;

	checkDBWrapperArray(dbWrappers);

	var workloadData = [];
	var workloadQueries = [];
	var workloadCounters = {
		read: 0,
		update: 0,
		insert: 0,
		query: 0
	};

	if (_workloadOptions && typeof _workloadOptions != 'object') throw new TypeError('when defined, _workloadOptions must be an object');

	var workloadOptionsDefaults = {
		fieldCount: 10,
		fieldSize: 100,
		docCount: 5000,
		operationCount: 5000,
		generateId: true,
		insertData: true,
		useAttachments: false,
		shuffleWorkloads: true,
		proportions: {
			read: 0, //Read by Id
			update: 0, //Update by id or query?
			insert: 0, //Insert by id or query?
			query: 0 //Advanced/compound search query
		},
		name: typeof name == 'string' ? name : 'Workload'
	};


	/// DO NOT USE ARRAY.PUSH

	/*
	Insert data can be determined by the insert proportion...
	Let's set r = insertProportion. 1-r will be the proportion of data to be inserted ahead of time
	*/

	var workloadOptions = {};
	//Shallow copy of _workloadOptions
	for (var propName in _workloadOptions){
		workloadOptions[propName] = _workloadOptions[propName];
	}
	//Using workloadOptionsDefaults for undefined mandatory parameters
	for (var propName in workloadOptionsDefaults){
		workloadOptions[propName] = workloadOptions[propName] || workloadOptionsDefaults[propName];
	}

	var totalProportions =
		workloadOptions.proportions.read +
		workloadOptions.proportions.update +
		workloadOptions.proportions.insert +
		workloadOptions.proportions.query;

	if (totalProportions != 1){
		throw new TypeError('Invalid proportions sum:' + totalProportions);
	}

	if (!(workloadOptions.fieldNames && workloadOptions.fieldNames.length > 0)){
		var indexModel = {};
		var fieldNames = [];
		var fieldNamesCount = 0;

		var fieldNameLength = Math.ceil(Math.log2(workloadOptions.fieldCount)) * 2;

		if (workloadOptions.generateId){
			fieldNames.push('_id');
			fieldNamesCount++;
		}

		while (fieldNamesCount < workloadOptions.fieldCount){
			fieldNames.push(generateString(fieldNameLength));
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

	/*
	* START : DATA GENERATION FUNCTIONS
	*/

	function generateDoc(){
		var genFieldsCount = 0;

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

	function shuffleList(a){
		if (!(Array.isArray(a) && a.length > 0)) throw new TypeError('a must be a non empty array');

		var o = [];

		a.forEach(function(item){
			o.push({p: Math.random(), v: item});
		});

		o.sort(function(a, b){
			if (a.p < b.p){
				return -1;
			} else {
				return 1;
			}
		});

		return o.map(function(item){
			return item.v;
		});
	}

	function randomListItem(l){
		if (!Array.isArray(l)) throw new TypeError('l must be an array');
		if (l.length < 2) throw new TypeError('l must contain at least 2 items');

		var itemIndex = Math.floor(Math.random() * l.length);
		return l[itemIndex];
	}

	/*
	* END : DATA GENERATION FUNCTIONS
	*/

	function generateFunctionFactory(workloadOptions, dataList, attachmentsList){
		return function(dbWrappers, cb){
			checkDBWrapperArray(dbWrappers);
			if (typeof cb != 'function') throw new TypeError('cb must be a function');

			var aotInsertProportion =  1 - workloadOptions.proportions.insert;
			var aotDocNumber = Math.round(aotInsertProportion * workloadOptions.docCount);

			for (var i = 0; i < aotDocNumber; i++){
				dataList.push(generateDoc());
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
	}

	function runnerFunctionFactory(dataList, queriesList){
		return function(dbWrappers, cb){

			var gErrors = {}; //Global errors object
			var results = {}; //Global performance results object
			var wrapperIndex = 0;

			//Prepare queries and what not.
			//Generate missing docs (regarding insert proportion)
			//Generate queries based upon existing docs, that are randomly selected from dataList

			//Ensuring proportions balance : current proportions are recalculated at each iteration
			//The type of operation to be scheduled/done in the current iteration is the type that has it's current proportion that furthest from its target proportion

			function runOnce(){

			}

			function nextDb(){
				wrapperIndex++;
			}

		}
	}
}
