(function(BenchmarkWorkloads){

	BenchmarkWorkloads.mostlyRead = {
		proportions: {
			read: .95,
			update: .05,
			insert: 0,
			query: 0
		},
		name: 'Mostly-Read'
	};

})(window.BenchmarkWorkloads = window.BenchmarkWorkloads || {});
