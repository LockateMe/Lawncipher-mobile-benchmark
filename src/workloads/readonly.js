(function(BenchmarkWorkloads){

	BenchmarkWorkloads.readOnly = {
		proportions: {
			read: 1,
			update: 0,
			insert: 0,
			query: 0
		},
		name: 'Read-only'
	};

})(window.BenchmarkWorkloads = window.BenchmarkWorkloads || {});
