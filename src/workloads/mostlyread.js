(function(BenchmarkWorkloads){

	BenchmarkWorkloads.mostlyRead = {
		proportions: {
			read: .95,
			update: .05,
			insert: 0,
			query: 0
		},
		name: 'Mostly-Read',
		docCount: 100,
		operationCount: 100
	};

})(window.BenchmarkWorkloads = window.BenchmarkWorkloads || {});
