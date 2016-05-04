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
        window.forceTypeTests = true;

        this.bindEvents();
    },
    // Bind Event Listeners
    //
    // Bind any events that are required on startup. Common events are:
    // 'load', 'deviceready', 'offline', and 'online'.
    bindEvents: function() {
        document.addEventListener('deviceready', this.onDeviceReady, false);
        $('#workloadStart').on('tap', app.onStartTap);
    },
    // deviceready Event Handler
    //
    // The scope of 'this' is the event. In order to call the 'receivedEvent'
    // function, we must explicitly call 'app.receivedEvent(...);'
    onDeviceReady: function() {
        app.enableStart();
    },
    onStartTap: function(){
        console.log('touch');

        var selectedWorkloadName = $('#workloadSelect').val();
        var selectedPouchAdapter = $('#adapterSelect').val();
        var useIndexModel = $('#useIndexModelSelect').val();
        var selectedDocCount = parseInt($('#docCountSelect').val());
        var selectedOpCount = parseInt($('#opCountSelect').val());

        var selectedWorkloadOptions = BenchmarkWorkloads[selectedWorkloadName];
        if (!selectedWorkloadOptions){
            console.log('Cannot find parameters for workload ' + selectedWorkloadName);
            return;
        }

        app.disableStart();

        selectedWorkloadOptions = shallowCopy(selectedWorkloadOptions);
        selectedWorkloadOptions.useIndexModel = useIndexModel == 'use' ? true : false;
        selectedWorkloadOptions.pouchAdapter = selectedPouchAdapter;
        selectedWorkloadOptions.docCount = selectedDocCount;
        selectedWorkloadOptions.operationCount = selectedOpCount;

        var w = new Workload(undefined, selectedWorkloadOptions, function(err){
            if (err){
                console.error(JSON.stringify(err));
                app.enableStart();
                return;
            }

            w.run(function(err, results){
                if (err){
                    console.error(JSON.stringify(err));
                    console.error('Intermediate result: ' + JSON.stringify(results));
                } else {
                    app.renderResults(selectedWorkloadOptions, results);
                }

                app.enableStart();
            });
        });
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
        workloadLawncipherCell.text(results['Lawncipher'] + 'ms');

        var workloadPouchCell = $('<td></td>');
        workloadPouchCell.text(results['PouchDB'] + 'ms');

        tableRow.append(workloadDetailsLink);
        tableRow.append(workloadLawncipherCell);
        tableRow.append(workloadPouchCell);
        $('#workloadResultsTable').append(tableRow);
    }
};

app.initialize();
