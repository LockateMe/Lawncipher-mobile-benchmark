(function(BenchmarkWorkloads){

	BenchmarkWorkloads.readWrite = {
		proportions: {
			read: .5,
			update: .5,
			insert: 0,
			query: 0
		},
		name: 'Read-Write',
		docCount: 100,
		operationCount: 100
	};

})(window.BenchmarkWorkloads = window.BenchmarkWorkloads || {});
