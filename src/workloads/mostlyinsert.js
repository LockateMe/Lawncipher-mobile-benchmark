(function(BenchmarkWorkloads){

	BenchmarkWorkloads.mostlyInsert = {
		proportions: {
			read: .05,
			update: 0,
			insert: .95,
			query: 0
		},
		name: 'Mostly-Insert'
	};

})(window.BenchmarkWorkloads = window.BenchmarkWorkloads || {});
