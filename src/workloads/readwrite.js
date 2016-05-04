(function(BenchmarkWorkloads){

	BenchmarkWorkloads.readWrite = {
		proportions: {
			read: .5,
			update: .5,
			insert: 0,
			query: 0
		},
		name: 'Read-Write'
	};

})(window.BenchmarkWorkloads = window.BenchmarkWorkloads || {});
