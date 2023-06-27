/* global $ */

import { 
  get_request_api, 
  post_request_api, 
  notify_auto_api, 
  ajax_notify_error, 
  notify_error, 
  case_param, 
  load_menu_mod_options, 
  isWhiteSpace, 
  sanitizeHTML, 
  setOnClickEventFromMap
} from './common.js';

import Chart from 'chartjs';

import endpoints from './api.map.js';

// $.fn.selectpicker.Constructor.BootstrapVersion = '4';


/**
 * Namespace for dashboard events.
 */
const dashEventNamespace = "dashEventNamespace";

/**
 * Namespace for dashboard click events.
 */
const dashClickEventNamespace = `click.${dashEventNamespace}`;

/**
 * Map of dashboard events and their corresponding functions.
 */
const dashboardEventsMap = {
  "#dashboardUpdateGlobalTasksButton": function() {update_gtasks_list();},
  "#dashboardUpdateTasksButton": function() {update_utasks_list();},
  "#dashboardAddGlobalTaskButton": function() {add_gtask();},
  ".edit-dashboard-gtask": function() {edit_gtask($(this).attr('data-id'));}
}


/**
 * This code block initializes a DataTable for the User Tasks table.
 * It sets the table's columns and their respective data sources.
 * It also sets the table's row callback function and its options.
 * @return {void}
 */
let UserTaskTable = $("#utasks_table").DataTable({
  dom: 'Blfrtip',
  aaData: [],
  aoColumns: [
    {
      "data": "task_title",
      "render": function (data, type, row) {
        if (type === 'display') {
          if (isWhiteSpace(data)) {
              data = '#' + row['task_id'];
          } else {
              data = sanitizeHTML(data);
          }
          data = `<a href="${endpoints.case.tasks.root}?cid=${row['case_id']}&shared=${row['task_id']}">${data}</a>`;
        }
        return data;
      }
    },
    { "data": "task_description",
    "render": function (data, type) {
        if (type === 'display') {
          data = sanitizeHTML(data);
          let datas = '<span data-toggle="popover" style="cursor: pointer;" title="Info" data-trigger="hover" href="#" data-content="' + data + '">' + data.slice(0, 70);

          if (data.length > 70) {
              datas += ' (..)</span>';
          } else {
              datas += '</span>';
          }
          return datas;
        }
        return data;
      }
    },
    {
      "data": "task_status_id",
      "render": function(data, type, row) {
        if (type === 'display') {
            data = sanitizeHTML(data);
            data = '<span class="badge ml-2 badge-'+ row['status_bscolor'] +'">' + row['status_name'] + '</span>';
        }
        return data;
      }
    },
    {
      "data": "task_case",
      "render": function (data, type, row) {
          if (type === 'display') {
              data = sanitizeHTML(data);
              data = '<a href="/case?cid='+ row['case_id'] +'">' + data +'</a>';
          }
          return data;
        }
    },
    {
      "data": "task_last_update",
      "render": function (data, type) {
        if (type === 'display' && data != null) {
            data = sanitizeHTML(data);
            data = data.replace(/GMT/g, "");
        }
        return data;
      }
    },
    { "data": "task_tags",
      "render": function (data, type) {
        if (type === 'display' && data != null) {
            let tags = "";
            let de = data.split(',');
            for (let tag in de) {
              tags += '<span class="badge badge-primary ml-2">' + sanitizeHTML(de[tag]) + '</span>';
            }
            return tags;
        }
        return data;
      }
    }
  ],
  rowCallback: function (nRow, data) {
      data = sanitizeHTML(data);
      nRow = '<span class="badge ml-2 badge-'+ sanitizeHTML(data['status_bscolor']) +'">' + sanitizeHTML(data['status_name']) + '</span>';
  },
  filter: true,
  info: true,
  ordering: true,
  processing: true,
  retrieve: true,
  lengthChange: false,
  pageLength: 10,
  order: [[ 2, "asc" ]],
  buttons: [
      { "extend": 'csvHtml5', "text":'Export',"className": 'btn btn-primary btn-border btn-round btn-sm float-left mr-4 mt-2' },
      { "extend": 'copyHtml5', "text":'Copy',"className": 'btn btn-primary btn-border btn-round btn-sm float-left mr-4 mt-2' },
  ],
  select: true
});

$("#utasks_table").css("font-size", 12);



/*
* DataTable initialization for the gtasks_table.
* It sets the table's columns and their respective data.
* It also sets the table's buttons and other options.
*/
let GTaskTable = $("#gtasks_table").DataTable({
    dom: 'Blfrtip',
    aaData: [],
    aoColumns: [
      {
        "data": "task_title",
        "render": function (data, type, row) {
          if (type === 'display') {
            if (isWhiteSpace(data)) {
                data = '#' + row['task_id'];
            } else {
                data = sanitizeHTML(data);
            }
            data = `<a href="#" class="edit-dashboard-gtask" data-id="${row['task_id']}">${data}</a>`;
          }
          return data;
        }
      },
      { "data": "task_description",
      "render": function (data, type) {
          if (type === 'display') {
            data = sanitizeHTML(data);
            let datas = '<span data-toggle="popover" style="cursor: pointer;" title="Info" data-trigger="hover" href="#" data-content="' + data + '">' + data.slice(0, 70);

            if (data.length > 70) {
                datas += ' (..)</span>';
            } else {
                datas += '</span>';
            }
            return datas;
          }
          return data;
        }
      },
      {
        "data": "task_status_id",
        "render": function(data, type, row) {
            if (type === 'display' && data != null) {
                data = sanitizeHTML(data);
                data = '<span class="badge ml-2 badge-'+ row['status_bscolor'] +'">' + row['status_name'] + '</span>';
            }
          return data;
        }
      },
      {
        "data": "user_name",
        "render": function (data, type) {
            if (type === 'display') { data = sanitizeHTML(data);}
            return data;
          }
      },
      {
        "data": "task_last_update",
        "render": function (data, type) {
          if (type === 'display' && data != null) {
              data = sanitizeHTML(data);
              data = data.replace(/GMT/g, "");
          }
          return data;
        }
      },
      { "data": "task_tags",
        "render": function (data, type) {
          if (type === 'display' && data != null) {
              let tags = "";
              let de = data.split(',');
              for (let tag in de) {
                tags += '<span class="badge badge-primary ml-2">' + sanitizeHTML(de[tag]) + '</span>';
              }
              return tags;
          }
          return data;
        }
      }
    ],
    rowCallback: function (nRow, data) {
        nRow = '<span class="badge ml-2 badge-'+ sanitizeHTML(data['status_bscolor']) +'">' + sanitizeHTML(data['status_name']) + '</span>';
    },
    filter: true,
    info: true,
    ordering: true,
    processing: true,
    retrieve: true,
    lengthChange: false,
    pageLength: 10,
    order: [[ 2, "asc" ]],
    buttons: [
        { "extend": 'csvHtml5', "text":'Export',"className": 'btn btn-primary btn-border btn-round btn-sm float-left mr-4 mt-2' },
        { "extend": 'copyHtml5', "text":'Copy',"className": 'btn btn-primary btn-border btn-round btn-sm float-left mr-4 mt-2' },
    ],
    select: true
});

$("#gtasks_table").css("font-size", 12);


/** This function checks for updates on the page by calling the update_gtasks_list() and update_utasks_list() functions.
* @param None
* @return None
*/
function check_page_update(){
  update_gtasks_list();
  update_utasks_list();
}

/** This function loads the task status of a given task ID and displays it in a modal.
* It makes an API request to get the task status and displays it in the modal body.
* @param id: The ID of the task to get the status for.
* @return None
*/
function task_status(id) {
  let url = 'tasks/status/human/'+id + case_param();
  $('#info_task_modal_body').load(url, function (response, status, xhr) {
    if (status !== "success") {
       ajax_notify_error(xhr, url);
       return false;
    }
    $('#modal_task_detail').modal({show:true});
  });
}


/** This function updates the user tasks list by making an API request to the server.
* If the request is successful, it updates the user tasks list and redraws the table.
* It also makes the cells of the table editable and allows the user to update the status of the task.
* @param None
* @return None
*/
function update_utasks_list() {
    // Clear the user tasks list
    $('#utasks_list').empty();
    // Make an API request to get the user tasks list
    get_request_api(endpoints.user.list_tasks)
    .done((data) => {
        // If the API request is successful, update the user tasks list and redraw the table
        if (notify_auto_api(data, true)) {
            // Destroy the editable cells of the table
            UserTaskTable.MakeCellsEditable("destroy");
            // Get the user tasks list from the API response
            let tasks_list = data.data.tasks;
            // Update the count of user tasks
            $('#user_attr_count').text(tasks_list.length);
            // Update the icon of user tasks
            if (tasks_list.length != 0){
                $('#icon_user_task').removeClass().addClass('flaticon-alarm text-danger');
            } else {
                $('#icon_user_task').removeClass().addClass('flaticon-success text-success');
            }
            // Get the options for the status of the task from the API response
            let options_l = data.data.tasks_status;
            let options = [];
            for (let index in options_l) {
                let option = options_l[index];
                options.push({ "value": option.id, "display": option.status_name })
            }
            // Clear the table
            UserTaskTable.clear();
            // Add the user tasks to the table
            UserTaskTable.rows.add(tasks_list);
            // Make the cells of the table editable
            UserTaskTable.MakeCellsEditable({
                "onUpdate": callBackEditUserTaskStatus,
                "inputCss": 'form-control col-12',
                "columns": [2],
                "allowNulls": {
                  "columns": [2],
                  "errorClass": 'error'
                },
                "confirmationButton": {
                  "confirmCss": 'my-confirm-class',
                  "cancelCss": 'my-cancel-class'
                },
                "inputTypes": [
                  {
                    "column": 2,
                    "type": "list",
                    "options": options
                  }
                ]
              });

            UserTaskTable.columns.adjust().draw();
            // Append the table buttons to the table info
            UserTaskTable.buttons().container().appendTo($('#utasks_table_info'));
            // Update the last updated time of the table
            $('#utasks_last_updated').text("Last updated: " + new Date().toLocaleTimeString());
        }
    });
}



/**
 * This function is called when a user task status is edited.
 * It sends a POST request to update the user task status on the server.
 * If the request is successful, it updates the user tasks list and redraws the table.
 * @param {Object} updatedCell - The updated cell object.
 * @param {Object} updatedRow - The updated row object.
 */
function callBackEditUserTaskStatus(updatedCell, updatedRow) {
  let data_send = updatedRow.data()
  data_send['csrf_token'] = $('#csrf_token').val();
  post_request_api(endpoints.user.update_task_status, JSON.stringify(data_send))
  .done((data) => {
    if (notify_auto_api(data)) {
       update_utasks_list();
       UserTaskTable.columns.adjust().draw();
    }
  });
}


/**** GTASKS ****/

/**
 * This function adds a new global task.
 * It sends a POST request to the server to add the task.
 * If the request is successful, it updates the global tasks list and hides the modal.
 */
function add_gtask() {
  const url = endpoints.global_tasks.add_modal + case_param();
  $('#modal_add_gtask_content').load(url, function (response, status, xhr) {
    if (status !== "success") {
       ajax_notify_error(xhr, url);
       return false;
    }

    $('#submit_new_gtask').on("click", function () {
      let data_sent = $('#form_new_gtask').serializeObject();
      data_sent['task_tags'] = $('#task_tags').val();
      data_sent['task_assignees_id'] = $('#task_assignees_id').val();
      data_sent['task_status_id'] = $('#task_status_id').val();
      data_sent['csrf_token'] = $('#csrf_token').val();

      post_request_api(endpoints.global_tasks.add, JSON.stringify(data_sent), true)
      .done((data) => {
        if(notify_auto_api(data)) {
          update_gtasks_list();
          $('#modal_add_gtask').modal('hide');
        }
      });

      return false;
    })

    $('#task_tags').amsifySuggestags({printValues: false });
    
    $('#task_assignee_id').selectpicker({
      liveSearch: true,
      style: "btn-light",
    });

    $('#task_status_id').selectpicker({
      liveSearch: true,
      style: "btn-light",
    });
    
    $('#modal_add_gtask').modal({ show: true });

  });

}

/**
 * This function updates a global task.
 * It sends a POST request to the server to update the task.
 * If the request is successful, it updates the global tasks list and hides the modal.
 * @param {number} id - The ID of the task to be updated.
 */
function update_gtask(id) {
  let data_sent = $('#form_new_gtask').serializeObject();
  data_sent['task_tags'] = $('#task_tags').val();
  data_sent['task_assignee_id'] = $('#task_assignee_id').val();
  data_sent['task_status_id'] = $('#task_status_id').val();
  data_sent['csrf_token'] = $('#csrf_token').val();

  post_request_api(endpoints.global_tasks.update +id, JSON.stringify(data_sent), true)
  .done((data) => {
    if(notify_auto_api(data)) {
      update_gtasks_list();
      $('#modal_add_gtask').modal('hide');
    }
  });
}

/**
 * This function deletes a global task.
 * It sends a POST request to the server to delete the task.
 * If the request is successful, it updates the global tasks list and hides the modal.
 * @param {number} id - The ID of the task to be deleted.
 */
function delete_gtask(id) {
  post_request_api(endpoints.global_tasks.delete + id)
  .done((data) => {
    if(notify_auto_api(data)) {
      update_gtasks_list();
      $('#modal_add_gtask').modal('hide');
    }
  });
}


/* Edit and event from the timeline thanks to its ID */

/**
 * This function loads the modal for editing a global task.
 * It sends a GET request to the server to get the modal content.
 * If the request is successful, it loads the modal content and initializes the form elements.
 * @param {number} id - The ID of the task to be edited.
 */
function edit_gtask(id) {
  const url = endpoints.global_tasks.update + id + "/modal" + case_param();
  $('#modal_add_gtask_content').load(url, function (response, status, xhr) {
        if (status !== "success") {
             ajax_notify_error(xhr, url);
             return false;
        }

        // Initialize the suggestags plugin for the task tags input field
        $('#task_tags').amsifySuggestags({printValues: false });
        
        // Initialize the selectpicker plugin for the task assignee dropdown
        $('#task_assignee_id').selectpicker({
          liveSearch: true,
          style: "btn-light",
        });

        // Initialize the selectpicker plugin for the task status dropdown
        $('#task_status_id').selectpicker({
          liveSearch: true,
          style: "btn-light",
        });

        // Bind the delete button to the delete_gtask function
        $('#dashboardDeleteGTask').on("click", function () {
            delete_gtask($(this).data('id'));
            return false;
        });

        // Bind the update button to the update_gtask function
        $('#dashboardUpdateGTask').on("click", function () {
            update_gtask($(this).data('id'));
            return false;
        });

        // Show the modal
        $('#modal_add_gtask').modal({show:true});
  });
}



const htmlLegendsChart = document.getElementById('htmlLegendsChart').getContext('2d');

/**
 * Loads the data for the case charts.
 */
$.ajax({
    url: endpoints.dashboard.case_charts + case_param(),
    type: "GET",
    dataType: "JSON",
    success: function (data) {
        const jsdata = data;
        if (jsdata.status == "success") {
            // Chart with HTML Legends
            var gradientStroke = htmlLegendsChart.createLinearGradient(500, 0, 100, 0);
            gradientStroke.addColorStop(0, '#177dff');
            gradientStroke.addColorStop(1, '#80b6f4');

            var gradientFill = htmlLegendsChart.createLinearGradient(500, 0, 100, 0);
            gradientFill.addColorStop(0, "rgba(23, 125, 255, 0.7)");
            gradientFill.addColorStop(1, "rgba(128, 182, 244, 0.3)");
            
           new Chart(htmlLegendsChart, {
                type: 'line',
                data: {
                    labels: jsdata.data[0],
                    datasets: [  {
                        label: "Opened case",
                        borderColor: gradientStroke,
                        pointBackgroundColor: gradientStroke,
                        pointRadius: 0,
                        backgroundColor: gradientFill,
                        legendColor: '#fff',
                        fill: true,
                        borderWidth: 1,
                        data: jsdata.data[1]
                    }]
                },
                options : {
                    responsive: true,
                    maintainAspectRatio: false,
                    legend: {
                        display: false
                    },
                    tooltips: {
                        bodySpacing: 4,
                        mode:"nearest",
                        intersect: 0,
                        position:"nearest",
                        xPadding:10,
                        yPadding:10,
                        caretPadding:10
                    },
                    layout:{
                        padding:{left:15,right:15,top:15,bottom:15}
                    },
                    scales: {
                        yAxes: [{
                            ticks: {
                                display: false
                            },
                            gridLines: {
                                drawTicks: false,
                                display: false
                            }
                        }],
                        xAxes: [{
                            gridLines: {
                                zeroLineColor: "transparent",
                                display: false
                            },
                            ticks: {
                                padding: 20,
                                fontColor: "rgba(0,0,0,0.5)",
                                fontStyle: "500",
                                display: false
                            }
                        }]
                    },
                    legendCallback: function(chart) {
                        var text = [];
                        text.push('<ul class="' + chart.id + '-legend html-legend">');
                        for (var i = 0; i < chart.data.datasets.length; i++) {
                            text.push('<li><span style="background-color:' + chart.data.datasets[i].legendColor + '"></span>');
                            if (chart.data.datasets[i].label) {
                                text.push(chart.data.datasets[i].label);
                            }
                            text.push('</li>');
                        }
                        text.push('</ul>');
                        return text.join('');
                    }
                }
            });

            //var myLegendContainer = document.getElementById("myChartLegend");

            // generate HTML legend
            //myLegendContainer.innerHTML = myHtmlLegendsChart.generateLegend();
        }
    },
    error: function (error) {
        notify_error(error);
    }
});


/* Fetch and draw the tasks */

/**
 * Updates the global tasks list by making an API request to get the list of tasks and displaying them in a table.
 * The function also adds event listeners to the edit and delete buttons of each task.
 * @function
 */
function update_gtasks_list() {
  $('#gtasks_list').empty();

  get_request_api(endpoints.global_tasks.list)
  .done((data) => {
    if(notify_auto_api(data, true)) {
      GTaskTable.MakeCellsEditable("destroy");
      let tasks_list = data.data.tasks;

      let options_l = data.data.tasks_status;
      let options = [];
      for (let index in options_l) {
        let option = options_l[index];
        options.push({ "value": option.id, "display": option.status_name })
      }

      GTaskTable.clear();
      GTaskTable.rows.add(tasks_list);

      GTaskTable.columns.adjust().draw();
      GTaskTable.buttons().container().appendTo($('#gtasks_table_info'));

      $('.edit-dashboard-gtask').on(dashClickEventNamespace, function() {
        edit_gtask($(this).attr('data-id'));
        return false;
      });

      load_menu_mod_options('global_task', GTaskTable, delete_gtask);
      $('#tasks_last_updated').text("Last updated: " + new Date().toLocaleTimeString());
    }
  });
}


$(function() {

      update_gtasks_list(); 
      update_utasks_list();
      setInterval(check_page_update,30000);

      setOnClickEventFromMap(dashboardEventsMap, dashClickEventNamespace);

});