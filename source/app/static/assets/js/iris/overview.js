import $ from 'jquery';
import { 
  addFilterFields, 
  tableFiltering 
} from "./datatablesUtils";

import { 
  sanitizeHTML, 
  isWhiteSpace, 
  get_request_api,
  notify_auto_api,
  get_avatar_initials,
  setOnClickEventFromMap
} from './common.js';

import endpoints from './api.map.js';

/**
 * Namespace for overview events.
 */
const overviewEventNamespace = "overviewEventNamespace";

/**
 * Namespace for overview click events.
 */
const overviewClickEventNamespace = `click.${overviewEventNamespace}`;

/**
 * Map of overview events and their corresponding functions.
 */
const overviewEventsMap = {
  "#overviewGetOverviewBtn": function() {get_cases_overview();}, 
}

/**
 * Adds filter fields to a table element.
 * 
 * @param {string} element - The ID of the table element to add filter fields to.
 */
$.each($.find("table"), function(index, element){
    addFilterFields($(element).attr("id"));
});

/**
 * Initializes the DataTable for the overview table and sets its properties.
 */
var OverviewTable = $("#overview_table").DataTable({
    // Set the DOM layout for the table
    dom: '<"container-fluid"<"row"<"col"l><"col"f>>>rt<"container-fluid"<"row"<"col"i><"col"p>>>',
    // Set the initial data for the table
    aaData: [],
    // Define the columns for the table and set their rendering functions
    aoColumns: [
      {
        "data": "case_title",
        "render": function (data, type, row) {
          // If the column is being displayed, sanitize the data and add a link to the case
          if (type === 'display') {
            if (isWhiteSpace(data)) {
                data = '#' + row['case_id'];
            } else {
                data = sanitizeHTML(data);
            }
            data = `<a rel="noopener" title="Open case in new tab" target="_blank" href="${endpoints.case.root}?cid=${row['case_id']}">${data}</a>`;
          }
          return data;
        }
      },
      { "data": "customer_name",
       "render": function (data, type) {
          // If the column is being displayed, sanitize the data
          if (type === 'display') {
            data = sanitizeHTML(data);
          }
          return data;
        }
      },
      {
        "data": "classification",
        "render": function (data, type) {
            // If the column is being displayed and the data is not null, sanitize the data
            if (type === 'display' && data != null) {
                data = sanitizeHTML(data);
            }
            return data;
        }
      },
      {
        "data": "state",
        "render": function (data, type) {
            // If the column is being displayed and the data is not null, sanitize the data
            if (type === 'display' && data != null) {
                data = sanitizeHTML(data);
            }
            return data;
        }
      },
      {
        "data": "case_open_since_days",
        "render": function(data, type) {
           // If the column is being displayed, format the data as a string with an icon and a title
           if (type === 'display') {
              let title = "You're not forgetting me, are you?";
              if (data <= 1) {
                data = `<i title="Sounds good" class="text-success fw-bold fa-solid fa-stopwatch mr-1"></i>${data} day`;
              }
              else if (data <= 7) {
                data = `<i title="Sounds good" class="text-success fw-bold fa-solid fa-stopwatch mr-1"></i>${data} days`;
              } else if (7 < data && data < 14) {
                data = `<i title="${title}" class="text-warning fw-bold fa-solid fa-stopwatch mr-1"></i>${data} days</div>`;
              } else {
                data = `<i title="${title}" class="text-danger fw-bold fa-solid fa-stopwatch mr-1"></i>${data} days</div>`;
              }
          }
          return data;
        }
      },
      {
        "data": "case_open_date",
        "render": function (data, type) {
            // If the column is being displayed and the data is not null, sanitize the data
            if (type === 'display' && data != null) {
              data = sanitizeHTML(data);
            }
            return data;
          }
      },
      {
        "data": "tasks_status",
        "render": function (data, type) {
          // If the column is being displayed and the data is not null, format the data as a progress bar and a text label
          if (type === 'display' && data != null) {
              const now = (data.closed_tasks / (data.closed_tasks + data.open_tasks))*100;
              const tasks_text = data.closed_tasks + data.open_tasks > 1 ? `tasks`: `task`;
              data = `<div class="progress progress-sm">
                    <div class="progress-bar bg-success" style="width:${now}%" role="progressbar" aria-valuenow="${now}" aria-valuemin="0" aria-valuemax="100"></div>
               </div><small class="float-right">${data.closed_tasks} / ${data.closed_tasks + data.open_tasks} ${tasks_text} done</small>`;
          }
          return data;
        }
      },
      {
        "data": "owner",
        "render": function (data, type) {
          // If the column is being displayed and the data is not null, sanitize the data and add an avatar
          if (type === 'display' && data != null) {
              let sdata = sanitizeHTML(data);
              data = `<div class="row">${get_avatar_initials(sdata, true)} <span class="mt-2 ml-1">${sdata}</span></div>`;
          }
          return data;
        }
      }
    ],
    // Enable filtering, info, ordering, processing, and length change for the table
    filter: true,
    info: true,
    ordering: true,
    processing: true,
    lengthChange: true,
    // Set the page length and initial sorting order for the table
    pageLength: 25,
    order: [[ 1, "asc" ]],
    // Add export and copy buttons to the table
    buttons: [
        { "extend": 'csvHtml5', "text":'Export',"className": 'btn btn-primary btn-border btn-round btn-sm float-left mr-4 mt-2' },
        { "extend": 'copyHtml5', "text":'Copy',"className": 'btn btn-primary btn-border btn-round btn-sm float-left mr-4 mt-2' },
    ],
    // Enable responsive design for the table
    responsive: {
        details: {
            display: $.fn.dataTable.Responsive.display.childRow,
            renderer: $.fn.dataTable.Responsive.renderer.tableAll()
        }
    },
    // Set the table filtering function
    initComplete: function () {
            tableFiltering(this.api(), 'overview_table');
        }
    });

/**
 * Sends a GET request to the API to retrieve the cases overview data.
 * 
 * @param {boolean} silent - Whether to show notifications or not.
 */
function get_cases_overview(silent) {
    // Send a GET request to the API to retrieve the cases overview data
    get_request_api(endpoints.overview.filter)
    .done((data) => {
        // If the response is successful, update the overview table with the retrieved data
        if(notify_auto_api(data, silent)) {
            let overview_list = data.data;
            OverviewTable.clear();
            OverviewTable.rows.add(overview_list);
            OverviewTable.columns.adjust().draw();
            // Add a click event listener to the truncate class to toggle the class on click
            $(".truncate").on("click", function() {
                var index = $(this).index() + 1;
                $('table tr td:nth-child(' + index  + ')').toggleClass("truncate");
            });
        }
    });
}

$(function() {
    get_cases_overview(true);

    setOnClickEventFromMap(overviewEventsMap, overviewClickEventNamespace);


});