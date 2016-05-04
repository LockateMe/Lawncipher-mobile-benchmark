(function(BenchmarkWorkloads){

	BenchmarkWorkloads.mixed = {
		proportions: {
			read: .55,
			insert: .1,
			update: .25,
			query: .1
		},
		name: 'Mixed'
	};

})(window.BenchmarkWorkloads = window.BenchmarkWorkloads || {});
