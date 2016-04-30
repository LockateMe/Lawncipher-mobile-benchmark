(function(BenchmarkWorkloads){

	BenchmarkWorkloads.blobMass = {
		proportions: {
			read: .9,
			update: .05,
			insert: .05,
			query: 0
		},
		docCount: 10000,
		operationCount: 250,
		useAttachments: true,
		name: 'Massive blob storage'
	}

})(window.BenchmarkWorkloads = window.BenchmarkWorkloads || {});
