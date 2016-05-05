(function(BenchmarkWorkloads){

	BenchmarkWorkloads.mostlyQuery = {
		proportions: {
			read: 0,
			update: 0.05,
			insert: 0,
			query: 0.95
		},
		name: 'Mostly-Query'
	}

})(window.BenchmarkWorkloads = window.BenchmarkWorkloads || {});
