(function(BenchmarkWorkloads){

	BenchmarkWorkloads.queryOnly = {
		proportions: {
			read: 0,
			update: 0,
			insert: 0,
			query: 1
		},
		name: 'Query-only'
	};

})(window.BenchmarkWorkloads = window.BenchmarkWorkloads || {});
