(function(BenchmarkWorkloads){

	BenchmarkWorkloads.collectionSizeStress = {
		proportions: {
			read: .2,
			update: .1,
			insert: .1,
			query: .4
		},
		docCount: 10000,
		operationCount: 250,
		name: 'Collection size stress'
	}

})(window.BenchmarkWorkloads = window.BenchmarkWorkloads || {});
