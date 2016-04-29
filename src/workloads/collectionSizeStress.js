(function(BenchmarkWorkloads){

	BenchmarkWorkloads.collectionSizeStress = {
		proportions: {
			read: .6,
			update: .1,
			insert: .1,
			query: .2
		},
		docCount: 10000,
		operationCount: 250
	}

})(window.BenchmarkWorkloads = window.BenchmarkWorkloads || {});
