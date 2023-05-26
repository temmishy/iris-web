import $ from 'jquery';
import { 
    notify_success,
    case_param, 
    get_request_api, 
    ajax_notify_error, 
    post_request_api,
    notify_auto_api, 
    sanitizeHTML
} from './common';

import { 
    addFilterFields, 
    tableFiltering 
} from './datatablesUtils';

import swal from 'sweetalert';

import endpoints from './api.map';  

var modal_user_cac_table = undefined;

/**
 * Adds a new protagonist to the protagonist list in the case edit form.
 */
function add_protagonist() {
    let prota_html = $('#protagonist_list_edit_template').html();
    $('#protagonist_list_edit').append(prota_html);
}

/**
 * Reloads the cases table with the latest data from the server.
 * 
 * @returns {boolean} Whether the cases table was successfully refreshed or not.
 */
function refresh_case_table() {
    // If the cases table doesn't exist, return false
    if ($('#cases_table').length === 0) {
        return false;
    }

    // Reload the cases table with the latest data from the server
    $('#cases_table').DataTable().ajax.reload();
    $('#cases_table').DataTable().columns.adjust().draw();
    notify_success('Cases list refreshed');
    return true;
}

/**
 * Displays the details of a case in a modal dialog.
 * 
 * @param {number} id - The ID of the case to display details for.
 */
function case_detail(id) {
    // Load the case details modal content into the case info modal
    let url = endpoints.case.details + id + case_param();
    $('#info_case_modal_content').load(url, function (response, status, xhr) {
        // If the modal content fails to load, display an error notification and return
        if (status !== "success") {
             ajax_notify_error(xhr, url);
             return false;
        }

        // Show the case info modal
        $('#modal_case_detail').modal({ show: true });
    });
}

/**
 * Asks the user to confirm the deletion of a case and deletes it if confirmed.
 * 
 * @param {number} id - The ID of the case to delete.
 */
export function remove_case(id) {
    // Display a confirmation dialog to the user
    swal({
        title: "Are you sure?",
        text: "You are about to delete this case forever. This cannot be reverted.\nAll associated data will be deleted",
        icon: "warning",
        buttons: true,
        dangerMode: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes, delete it!'
    })
    .then((willDelete) => {
        // If the user confirms the deletion, send a request to the server to delete the case
        if (willDelete) {
            post_request_api(endpoints.manage.cases.delete + id)
            .done((data) => {
                // If the deletion is successful, refresh the cases table and display a success notification
                if (notify_auto_api(data)) {
                    if (!refresh_case_table()) {
                        swal({
                            title: "Done!",
                            text: "You will be redirected in 5 seconds",
                            icon: "success",
                            buttons: false,
                            dangerMode: false
                        })
                        setTimeout(function () {
                            window.location.href = '/dashboard?cid=1';
                        }, 4500);
                    } else {
                        refresh_case_table();
                        $('#modal_case_detail').modal('hide');
                    }
                }
            });
        } else {
            // If the user cancels the deletion, display a message to indicate that the deletion was cancelled
            swal("Pfew, that was close");
        }
    });
}

/**
 * Reopens a closed case.
 * 
 * @param {number} id - The ID of the case to reopen.
 */
export function reopen_case(id) {
    // Send a request to the server to reopen the case
    post_request_api(endpoints.manage.cases.reopen + id)
    .done(() => {
        // If the reopening is successful, refresh the cases table and hide the case info modal
        if (!refresh_case_table()) {
            window.location.reload();
        }
        $('#modal_case_detail').modal('hide');
    });
}

/**
 * Displays a confirmation dialog to the user to close a case and closes it if confirmed.
 * 
 * @param {number} id - The ID of the case to close.
 */
export function close_case(id) {
    swal({
        title: "Are you sure?",
        text: "Case ID " + id + " will be closed and will not appear in contexts anymore",
        icon: "warning",
        buttons: true,
        dangerMode: true
    })
    .then((willClose) => {
        // If the user confirms the closure, send a request to the server to close the case
        if (willClose) {
            post_request_api(endpoints.manage.cases.close + id)
            .done(() => {
                // If the closure is successful, refresh the cases table and hide the case info modal
                if (!refresh_case_table()) {
                    window.location.reload();
                }
            });
        }
    });
}

/**
 * Enters edit mode for the case general information in the case info modal.
 */
export function edit_case_info() {
    $('#case_gen_info_content').hide();
    $('#case_gen_info_edit').show();
    $('#caseInfoEditCancelBtn').show();
    $('#caseInfoEditSaveBtn').show();
    $('#case_info').hide();
}

/**
 * Cancels the edit mode for the case general information in the case info modal.
 */
export function cancel_case_edit() {
    $('#case_gen_info_content').show();
    $('#case_gen_info_edit').hide();
    $('#caseInfoEditCancelBtn').hide();
    $('#case_info').show();
    $('#caseInfoEditSaveBtn').hide();
}

/**
 * Serializes the case edit form data and sends a request to the server to update the case.
 * 
 * @param {number} case_id - The ID of the case to update.
 */
export function save_case_edit(case_id) {
    // Serialize the case edit form data
    var data_sent = $('form#form_update_case').serializeObject();
    var map_protagonists = Object();

    // Extract the protagonist data from the serialized form data and store it in a map
    for (let e in data_sent) {
        if (e.startsWith('protagonist_role_')) {
            map_protagonists[e.replace('protagonist_role_', '')] = {
                'role': data_sent[e]
            };
            delete data_sent[e];
        }
        if (e.startsWith('protagonist_name_')) {
            map_protagonists[e.replace('protagonist_name_', '')]['name'] = data_sent[e];
            delete data_sent[e];
        }
        if (e.startsWith('protagonist_contact_')) {
            map_protagonists[e.replace('protagonist_contact_', '')]['contact'] = data_sent[e];
            delete data_sent[e];
        }
        if (e.startsWith('protagonist_id_')) {
            map_protagonists[e.replace('protagonist_id_', '')]['id'] = data_sent[e];
            delete data_sent[e];
        }
    }

    // Convert the protagonist map to an array and add it to the serialized form data
    data_sent['protagonists'] = [];
    for (let e in map_protagonists) {
        data_sent['protagonists'].push(map_protagonists[e]);
    }

    // Add the case tags to the serialized form data
    data_sent['case_tags'] = $('#case_tags').val();

    // Get the custom attributes fields and add them to the serialized form data
    let ret = get_custom_attributes_fields();
    let has_error = ret[0].length > 0;
    let attributes = ret[1];

    if (has_error){return false;}

    data_sent['custom_attributes'] = attributes;

    // Add the CSRF token to the serialized form data
    data_sent['csrf_token'] = $('#csrf_token').val();

    // Send a request to the server to update the case with the serialized form data
    post_request_api(endpoints.manage.cases.update + case_id, JSON.stringify(data_sent), true, undefined, case_id)
    .done((data) => {
        // If the update is successful, display the case details and a success notification
        if(notify_auto_api(data)) {
            case_detail(case_id);
        }
    });
}
/**
 * Displays a confirmation dialog to the user to remove case access from a user and removes it if confirmed.
 * 
 * @param {number} user_id - The ID of the user to remove case access from.
 * @param {number} case_id - The ID of the case to remove access to.
 * @param {function} on_finish - A callback function to execute after the access is removed.
 */
export function remove_case_access_from_user(user_id, case_id, on_finish) {
    // Display a confirmation dialog to the user
    swal({
      title: "Are you sure?",
      text: "This user might not be able access this case anymore",
      icon: "warning",
      buttons: true,
      dangerMode: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, remove it!'
    })
    .then((willDelete) => {
        // If the user confirms the removal, send a request to the server to remove the case access
        if (willDelete) {
            let url = endpoints.manage.users.root + user_id + endpoints.manage.users.suffixes.delete_case_access;

            var data_sent = Object();
            data_sent['case'] = case_id;
            data_sent['csrf_token'] = $('#csrf_token').val();

            post_request_api(url, JSON.stringify(data_sent))
            .done((data) => {
                // If the removal is successful, execute the callback function (if provided) and display a success notification
                if(notify_auto_api(data)) {
                    if (on_finish !== undefined) {
                        on_finish();
                    }
                }
            }).always(() => {
                window.swal.close();
            });
        }
    });
}

/**
 * An array of objects representing the different access levels for a case.
 */
var access_levels = [
    { "id": 1, "name": "Deny all" },
    { "id": 2, "name": "Read only" },
    { "id": 4, "name": "Full access" }
]

/**
 * Generates HTML option elements for each access level object in the access_levels array.
 * 
 * @param {number} data - The ID of the currently selected access level.
 * @returns {string} A string of HTML option elements.
 */
function get_access_level_options(data) {
    var options = "";

    // Loop through each access level object in the access_levels array and generate an HTML option element for it
    for (var i = 0; i < access_levels.length; i++) {
        options += `<option value="${access_levels[i].id}" ${data == access_levels[i].id ? 'selected' : ''}>${access_levels[i].name}</option>`;
    }
    return options;
}

/**
 * Sends a request to the server to update a user's access level for a case.
 * 
 * @param {number} user_id - The ID of the user to update access for.
 * @param {number} case_id - The ID of the case to update access for.
 * @param {number} access_level - The ID of the access level to set for the user.
 */
function update_user_case_access_level(user_id, case_id, access_level) {
    // Create an object with the data to send in the request
    var data = {
        "case_id": parseInt(case_id),
        "user_id": parseInt(user_id),
        "access_level": parseInt(access_level),
        "csrf_token": $('#csrf_token').val()
    };

    // Send a request to the server to update the user's access level for the case
    post_request_api(endpoints.case.access.set_user, JSON.stringify(data), false, null, case_id)
    .done((data) => {
        // Display a notification to the user if the update is successful
        notify_auto_api(data);
    });
}

/**
 * Displays a modal dialog to view case access via a group.
 * 
 * @param {number} case_id - The ID of the case to view access for.
 */
function view_case_access_via_group(case_id) {
    // Load the case access modal content into the additional modal
    let url = endpoints.case.access.group_modal + case_param();
    $('#modal_ac_additional').load(url, function (response, status, xhr) {
        // If the modal content fails to load, display an error notification and return
        if (status !== "success") {
             ajax_notify_error(xhr, url);
             return false;
        }

        // Show the additional modal
        $('#modal_ac_additional').modal({ show: true });
    });
}

/**
 * Sends a request to the server to set a group's access level for a case.
 * 
 * @param {number} case_id - The ID of the case to set access for.
 */
function set_case_access_via_group(case_id) {
    // Create an object with the data to send in the request
    var data = {
        "case_id": parseInt(case_id),
        "access_level": parseInt($('#group_case_ac_select').val()),
        "group_id": parseInt($('#group_case_access_select').val()),
        "csrf_token": $('#csrf_token').val()
    };

    // Send a request to the server to set the group's access level for the case
    post_request_api(endpoints.case.access.set_group, JSON.stringify(data))
    .done((data) => {
        // Display a notification to the user if the update is successful, reload the case access info, and hide the additional modal
        notify_auto_api(data);
        access_case_info_reload(case_id);
        $('#modal_ac_additional').modal('hide');
    });
}


/**
 * Reloads the case access information for a given case ID and owner ID.
 * 
 * @param {number} case_id - The ID of the case to reload access information for.
 * @param {number} owner_id - The ID of the owner of the case.
 */
export function access_case_info_reload(case_id, owner_id) {
    var req_users = [];

    // Send a request to the server to get a list of users with access to the case
    get_request_api(endpoints.case.users.list)
    .done((data) => {
        // If the request is successful, check if the table already exists and notify the user if necessary
        let has_table = $.fn.dataTable.isDataTable( '#case_access_users_list_table' );
        if (!notify_auto_api(data, !has_table)) {
            return;
        }

        // Store the list of users with access to the case
        req_users = data.data;

        // If the table already exists, clear it and add the new data, then redraw it
        if ( has_table ) {
            let table = $('#case_access_users_list_table').DataTable();
            table.clear();
            table.rows.add(req_users);
            table.draw();
        } 
        // If the table does not exist, create it and add the new data
        else {
            // Add filter fields to the table
            addFilterFields($('#case_access_users_list_table').attr("id"));

            // Create the table with the list of users with access to the case
            $("#case_access_users_list_table").DataTable({
                    dom: '<"container-fluid"<"row"<"col"l><"col"f>>>rt<"container-fluid"<"row"<"col"i><"col"p>>>',
                    aaData: req_users,
                    aoColumns: [
                      {
                        "data": "user_id",
                        "className": "dt-center"
                    },
                    {
                        "data": "user_name",
                        "className": "dt-center",
                        "render": function (data, type) {
                            if (type === 'display') { data = sanitizeHTML(data);}
                            return data;
                        }
                    },
                    {
                        "data": "user_login",
                        "className": "dt-center",
                        "render": function (data, type) {
                            if (type === 'display') { data = sanitizeHTML(data);}
                            return data;
                        }
                    },
                    {
                        "data": "user_access_level",
                        "className": "dt-center",
                        "render": function ( data, type, row ) {
                            // Generate a select element with the access level options for the user
                            return `<select class="form-control" onchange="update_user_case_access_level('${row.user_id}',${case_id},this.value)">${get_access_level_options(data)}</select>`;
                        }
                    }
                    ],
                    filter: true,
                    info: true,
                    ordering: true,
                    processing: true,
                    initComplete: function () {
                        tableFiltering(this.api(), 'case_access_users_list_table');
                    }
            });
        }

        // Add the list of users to the username and email suggestion lists and the case owner select element
        for (var i = 0; i < req_users.length; i++) {
            $('#username-list').append($('<option>', {
                value: req_users[i].user_name
            }));
            $('#emails-list').append($('<option>', {
                value: req_users[i].user_email
            }));
            $('#case_quick_owner').append($('<option>', {
                value: req_users[i].user_id,
                text: req_users[i].user_name
            }));
            // Set the selected option to the owner ID if it matches
            if (req_users[i].user_id == owner_id) {
                $('#case_quick_owner').val(req_users[i].user_id);
            }
            $('#case_quick_owner').selectpicker('refresh');
        }
    });

    // Initialize the case tags suggestion list
    $('#case_tags').amsifySuggestags({
        printValues: false,
        suggestions: []
    });
}

/**
 * Refreshes the user's case access information in the user cases access modal table.
 * 
 * @param {number} user_id - The ID of the user to refresh case access information for.
 */
function refresh_user_cac(user_id) {
    // Check if the modal user cases access table exists
    if (modal_user_cac_table !== undefined) {
        // Send a request to the server to get the user's case access information
        get_request_api(endpoints.manage.users.root + user_id)
        .done((data) => {
            // If the request is successful, update the current user cases access list with the new data and redraw the table
            if(notify_auto_api(data)) {
                let current_user_cases_access_list = data.data.user_cases_access;
                modal_user_cac_table.clear();
                modal_user_cac_table.rows.add(current_user_cases_access_list).draw();
            }
        });
    }
}


/**
 * Displays a confirmation dialog to remove a user's access to multiple cases.
 * 
 * @param {number} user_id - The ID of the user to remove access for.
 * @param {array} cases - An array of case IDs to remove access for.
 * @param {function} on_finish - A callback function to execute after the access is removed.
 */
function remove_cases_access_user(user_id, cases, on_finish) {
    // Display a confirmation dialog to the user
    swal({
        title: "Are you sure?",
        text: "This user might not be able access these cases anymore",
        icon: "warning",
        buttons: true,
        dangerMode: true
    })
    .then((willDelete) => {
        // If the user confirms, send a request to the server to remove the user's access to the cases
        if (willDelete) {
            let url = endpoints.manage.users.root + user_id + endpoints.manage.users.suffixes.delete_cases_access;

            var data_sent = Object();
            data_sent['cases'] = cases;
            data_sent['csrf_token'] = $('#csrf_token').val();

            post_request_api(url, JSON.stringify(data_sent))
            .done((data) => {
                // If the request is successful, refresh the user's case access information and execute the callback function if provided
                if(notify_auto_api(data)) {
                    refresh_user_cac(user_id);

                    if (on_finish !== undefined) {
                        on_finish();
                    }
                }
            }).always(() => {
                window.swal.close();
            });
        }
    });
}