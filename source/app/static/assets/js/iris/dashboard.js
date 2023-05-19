import $ from 'jquery';

import { 
  get_request_api, 
  post_request_api, 
  notify_auto_api, 
  ajax_notify_error, 
  notify_error, 
  case_param, 
  load_menu_mod_options, 
  isWhiteSpace, 
  sanitizeHTML 
} from './common.js';

import Chart from 'chartjs';


$.fn.selectpicker.Constructor.BootstrapVersion = '4';


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
          data = '<a href="case/tasks?cid='+ row['case_id'] + '&shared=' + row['task_id'] + '">' + data +'</a>';
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
              data = '<a href="#" onclick="edit_gtask(\'' + row['task_id'] + '\');">' + data +'</a>';
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

function check_page_update(){
    update_gtasks_list();
    update_utasks_list();
}

export function task_status(id) {
    let url = 'tasks/status/human/'+id + case_param();
    $('#info_task_modal_body').load(url, function (response, status, xhr) {
        if (status !== "success") {
             ajax_notify_error(xhr, url);
             return false;
        }
        $('#modal_task_detail').modal({show:true});
    });
}

function update_utasks_list() {
    $('#utasks_list').empty();
    get_request_api("/user/tasks/list")
    .done((data) => {
        if (notify_auto_api(data, true)) {
            UserTaskTable.MakeCellsEditable("destroy");
            let tasks_list = data.data.tasks;

            $('#user_attr_count').text(tasks_list.length);
            if (tasks_list.length != 0){
                $('#icon_user_task').removeClass().addClass('flaticon-alarm text-danger');
            } else {
                $('#icon_user_task').removeClass().addClass('flaticon-success text-success');
            }
            let options_l = data.data.tasks_status;
            let options = [];
            for (let index in options_l) {
                let option = options_l[index];
                options.push({ "value": option.id, "display": option.status_name })
            }

            UserTaskTable.clear();
            UserTaskTable.rows.add(tasks_list);
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
            UserTaskTable.buttons().container().appendTo($('#utasks_table_info'));

            $('#utasks_last_updated').text("Last updated: " + new Date().toLocaleTimeString());
        }

    });
}

function callBackEditUserTaskStatus(updatedCell, updatedRow) {
    let data_send = updatedRow.data()
    data_send['csrf_token'] = $('#csrf_token').val();
    post_request_api("user/tasks/status/update", JSON.stringify(data_send))
    .done((data) => {
        if (notify_auto_api(data)) {
           update_utasks_list();
           UserTaskTable.columns.adjust().draw();
        }
    });
}


/**** GTASKS ****/

/* Fetch a modal that allows to add an event */
export function add_gtask() {
    const url = '/global/tasks/add/modal' + case_param();
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

            post_request_api('/global/tasks/add', JSON.stringify(data_sent), true)
            .done((data) => {
                if(notify_auto_api(data)) {
                    update_gtasks_list();
                    $('#modal_add_gtask').modal('hide');
                }
            });

            return false;
        })

    });

    $('#modal_add_gtask').modal({ show: true });
}

export function update_gtask(id) {
    let data_sent = $('#form_new_gtask').serializeObject();
    data_sent['task_tags'] = $('#task_tags').val();
    data_sent['task_assignee_id'] = $('#task_assignee_id').val();
    data_sent['task_status_id'] = $('#task_status_id').val();
    data_sent['csrf_token'] = $('#csrf_token').val();

    post_request_api('/global/tasks/update/' + id, JSON.stringify(data_sent), true)
    .done((data) => {
        if(notify_auto_api(data)) {
            update_gtasks_list();
            $('#modal_add_gtask').modal('hide');
        }
    });
}

/* Delete an event from the timeline thank to its id */
function delete_gtask(id) {
    post_request_api("/global/tasks/delete/" + id)
    .done((data) => {
        if(notify_auto_api(data)) {
            update_gtasks_list();
            $('#modal_add_gtask').modal('hide');
        }
    });
}

/* Edit and event from the timeline thanks to its ID */
export function edit_gtask(id) {
  const url = '/global/tasks/update/'+ id + "/modal" + case_param();
  $('#modal_add_gtask_content').load(url, function (response, status, xhr) {
        if (status !== "success") {
             ajax_notify_error(xhr, url);
             return false;
        }
        $('#modal_add_gtask').modal({show:true});
  });
}


const htmlLegendsChart = document.getElementById('htmlLegendsChart').getContext('2d');

$.ajax({
    url: '/dashboard/case_charts' + case_param(),
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
function update_gtasks_list() {
    $('#gtasks_list').empty();

    get_request_api("/global/tasks/list")
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

            load_menu_mod_options('global_task', GTaskTable, delete_gtask);
            $('#tasks_last_updated').text("Last updated: " + new Date().toLocaleTimeString());
        }
    });
}


$(function() {
      console.log('ready');
      update_gtasks_list(); 
      update_utasks_list();
      setInterval(check_page_update,30000);

      console.log($('#dashboardUpdateGlobalTasksButton'));

      $('#dashboardUpdateGlobalTasksButton').on('click', update_gtasks_list);
      $('#dashboardUpdateTasksButton').on('click', update_utasks_list);
      $('#dashboardAddGlobalTaskButton').on('click', add_gtask);

});