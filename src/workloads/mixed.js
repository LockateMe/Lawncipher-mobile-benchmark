(function(BenchmarkWorkloads){

	BenchmarkWorkloads.mixed = {
		proportions: {
			read: .65,
			insert: .1,
			update: .25,
			query: 0
		},
		name: 'Mixed'
	};

})(window.BenchmarkWorkloads = window.BenchmarkWorkloads || {});
