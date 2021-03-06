/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
var app = {
    // Application Constructor
    initialize: function() {
        window.forceTypeTests = false;

        this.bindEvents();
    },
    // Bind Event Listeners
    //
    // Bind any events that are required on startup. Common events are:
    // 'load', 'deviceready', 'offline', and 'online'.
    bindEvents: function() {
        document.addEventListener('deviceready', this.onDeviceReady, false);
        $('#workloadStart').on('tap', app.onStartTap);
        $('#workloadSelect').on('change', app.onWorkloadChange);
        $('input').on('tap', app.onInputTap);
    },
    // deviceready Event Handler
    //
    // The scope of 'this' is the event. In order to call the 'receivedEvent'
    // function, we must explicitly call 'app.receivedEvent(...);'
    onDeviceReady: function() {
        app.enableStart();
    },
    onStartTap: function(){
        var selectedWorkloadName = $('#workloadSelect').val();
        var selectedPouchAdapter = $('#adapterSelect').val();
        var useIndexModel = $('#useIndexModelSelect').val();
        var selectedDocCount = parseInt($('#docCountSelect').val());
        var selectedOpCount = parseInt($('#opCountSelect').val());
        var selectedRunCount = parseInt($('#runCountSelect').val());
        var selectedFieldCount = parseInt($('#fieldCountSelect').val());
        var selectedFieldSize = parseInt($('#fieldSizeSelect').val());

        var selectedWorkloadOptions = BenchmarkWorkloads[selectedWorkloadName];
        if (!selectedWorkloadOptions){
            console.log('Cannot find parameters for workload ' + selectedWorkloadName);
            return;
        }

        selectedWorkloadOptions = shallowCopy(selectedWorkloadOptions);
        selectedWorkloadOptions.useIndexModel = useIndexModel == 'use' ? true : false;
        selectedWorkloadOptions.pouchAdapter = selectedPouchAdapter;
        selectedWorkloadOptions.docCount = selectedDocCount;
        selectedWorkloadOptions.operationCount = selectedOpCount;
        selectedWorkloadOptions.fieldCount = selectedFieldCount;
        selectedWorkloadOptions.fieldSize = selectedFieldSize;

        var drivers = [];
        if ($('#enableLc').attr('checked')) drivers.push('Lawncipher');
        if ($('#enablePDB').attr('checked')) drivers.push('Pouch');

        if (drivers.length == 0){
            alert('You must select at least one database on which the workload will be run.');
            return;
        }

        app.disableStart();

        var runCount = 0;

        function runWorkloadOnce(){
            var w = new Workload(undefined, selectedWorkloadOptions, function(err, _w){
                if (err){
                    if (Array.isArray(err)){
                        for (var i = 0; i < err.length; i++){
                            console.error(err[i]);
                        }
                    } else console.error(JSON.stringify(err));
                    app.enableStart();
                    return;
                }

                if (!w) w = _w;

                w.run(function(err, results){
                    if (err){
                        if (Array.isArray(err)){
                            for (var i = 0; i < err.length; i++){
                                console.error(err[i]);
                            }
                        } else console.error(JSON.stringify(err));
                        //console.error('Intermediate result: ' + JSON.stringify(results));
                    }

                    app.renderResults(selectedWorkloadOptions, results);

                    nextRun();
                });
            }, drivers);
        }

        function nextRun(){
            runCount++;

            if (runCount == selectedRunCount){
                app.enableStart();
            } else {
                runWorkloadOnce();
            }
        }

        runWorkloadOnce();
    },
    onWorkloadChange: function(){
        var selectedWorkload = BenchmarkWorkloads[$('#workloadSelect').val()];
        if (!selectedWorkload){
            console.error($('#workloadSelect').val() + ' cannot be found');
            return;
        }
        if (selectedWorkload.docCount){
            $('#docCountSelect').val(selectedWorkload.docCount);
        } else {
            $('#docCountSelect').val(100);
        }
        if (selectedWorkload.operationCount){
            $('#opCountSelect').val(selectedWorkload.operationCount);
        } else {
            $('#opCountSelect').val(100);
        }
        if (selectedWorkload.fieldCount){
            $('#fieldCountSelect').val(selectedWorkload.fieldCount);
        } else {
            $('#fieldCountSelect').val(10);
        }
        if (selectedWorkload.fieldSize){
            $('#fieldSizeSelect').val(selectedWorkload.fieldSize);
        } else {
            $('#fieldSizeSelect').val(100);
        }
    },
    onInputTap: function(e){
        this.setSelectionRange(0, this.value.length);
    },
    enableStart: function(){
        $('#workloadStart').removeAttr('disabled');
    },
    disableStart: function(){
        $('#workloadStart').attr('disabled', 'true');
    },
    renderResults: function(workloadSettings, results){
        var tableRow = $('<tr></tr>');
        var workloadDetailsCell = $('<td></td>');
        var workloadDetailsLink = $('<a href="#"></a>');
        workloadDetailsLink.text(workloadSettings.name);
        workloadDetailsLink.on('tap', function(){
            alert(JSON.stringify(workloadSettings));
        });

        workloadDetailsCell.append(workloadDetailsLink);
        var workloadLawncipherCell = $('<td></td>');
        if (results['Lawncipher']) workloadLawncipherCell.text(results['Lawncipher'] + 'ms');

        var workloadPouchCell = $('<td></td>');
        if (results['PouchDB']) workloadPouchCell.text(results['PouchDB'] + 'ms');

        tableRow.append(workloadDetailsLink);
        tableRow.append(workloadLawncipherCell);
        tableRow.append(workloadPouchCell);
        $('#workloadResultsTable').append(tableRow);
    }
};

var _cb = function(err, r){
    if (err) throw err;
    console.log(JSON.stringify(r));
}

app.initialize();
