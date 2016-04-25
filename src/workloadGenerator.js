function WorkloadGenerator(dbWrappers, _workloadOptions){
	var from_string = sodium.from_string, to_string = sodium.to_string;
	var from_base64 = sodium.from_base64, to_base64 = sodium.to_base64;
	var from_hex = sodium.from_hex, to_hex = sodium.to_hex;

	checkDBWrapperArray(dbWrappers);

	if (_workloadOptions && typeof _workloadOptions != 'object') throw new TypeError('when defined, _workloadOptions must be an object');

	var workloadOptionsDefaults = {
		fieldCount: 10,
		fieldSize: 100,
		docCount: 5000,
		generateId: true,
		insertData: true,
		useAttachments: false,
		proportions: {
			read: 0, //Read by Id
			update: 0, //Update by id or query?
			insert: 0, //Insert by id or query?
			query: 0 //Advanced/compound search query
		}
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

	/*
	* END : DATA GENERATION FUNCTIONS
	*/

	function generateFunctionFactory(){
		return function(){}
	}
}
