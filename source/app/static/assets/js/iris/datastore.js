/* global $ */

import { get_request_api, 
    post_request_api, 
    notify_auto_api, 
    sanitizeHTML, 
    case_param, 
    ajax_notify_error,
    post_request_data_api, 
    notify_success, 
    notify_error, 
    downloadURI, 
    split_bool, 
    get_request_data_api, 
    setOnClickEventFromMap, 
    unsetOnClickEventFromMap
} from './common';

import ace from 'ace-builds/src-noconflict/ace';
import "ace-builds/webpack-resolver"
import "ace-builds/src-noconflict/ext-language_tools";
import "ace-builds/src-noconflict/mode-json";
import "ace-builds/src-noconflict/theme-tomorrow";

import swal from 'sweetalert';

let ds_filter;



/*
 * Namespace for datastore events
 */
const dsEventNamespace = 'dsEventNamespace';

/*
 * Namespace for click events in datastore
 */
const dsClickEventNamespace = `click.${dsEventNamespace}`;

/*
 * Map of events and their corresponding functions in datastore
 */
const dsStoreEventsMap = {
    "#dsRefreshDatastore": function() {refresh_ds();},
    "#dsToggleSelectFiles": function() {toggle_select_file();},
    "#dsDeleteBulkFiles": function() {delete_bulk_ds_file();},
    "#dsMoveFiles": function() {move_ds_file();},
    ".ds-reset-file-view": function() {reset_ds_file_view(); load_datastore();},
    "#dsValidateDsFileMove": function() {validate_ds_file_move();},
    "#dsValidateDSFolderMove": function() {validate_ds_folder_move();},
    "#dsFilterDSFile": function() {filter_ds_files();},
    "#dsResetSearchFilter": function() {reset_ds_files_filter();},
    "#dsFilterHelpWindow": function() {show_ds_filter_help();},
    ".ds-add-subfolder": function() {add_ds_folder(getParentDataNode($(this), 'node-id'));},
    ".ds-add-file": function() {add_ds_file(getParentDataNode($(this), 'node-id'));},
    ".ds-move-folder": function() {move_ds_folder(getParentDataNode($(this), 'node-id'));},
    ".ds-rename-folder": function() {rename_ds_folder(getParentDataNode($(this), 'node-id'), $(this).data('folder-name'));},
    ".ds-delete-folder": function() {delete_ds_folder(getParentDataNode($(this), 'node-id'));},
    ".ds-get-link-file-btn": function() {get_link_ds_file(getParentDataNode($(this), 'file-id'));},
    ".ds-get-md-link-file-btn": function() {get_mk_link_ds_file(getParentDataNode($(this), 'file-id'), $(this).data('file-name'), $(this).data('file-icon'), $(this).data('file-has-password'));},
    ".ds-info-file-btn": function() {info_ds_file(getParentDataNode($(this), 'file-id'));},
    ".ds-edit-file-btn": function() {edit_ds_file(getParentDataNode($(this), 'file-id'));},
    ".ds-move-file-btn": function() {move_ds_file(getParentDataNode($(this), 'file-id'));},
    ".ds-delete-file-btn": function() {delete_ds_file(getParentDataNode($(this), 'file-id'));},
    ".ds-file-selector": function() {ds_file_select($(this).parent().data('file-id'));},
    ".ds-download-file-btn": function() {download_ds_file(getParentDataNode($(this), 'file-id'));}
}


/**
 * Returns the parent data node of a given node with the specified data name.
 * 
 * @param {Object} node - The node to get the parent data node of.
 * @param {string} data_name - The name of the data to retrieve from the parent node.
 * @returns {Object} The parent data node with the specified data name.
 */
function getParentDataNode(node, data_name) {
    return node.parent().parent().data(data_name);
}

/**
 * Loads the datastore and sets up various features.
 * 
 * @param {boolean} do_set_events - Whether to set up event listeners.
 */
function load_datastore(do_set_events = false) {
    // Set up the Ace editor for the datastore file search
    ds_filter = ace.edit("ds_file_search",
    {
        autoScrollEditorIntoView: true,
        minLines: 1,
        maxLines: 5
    });
    ds_filter.setTheme("ace/theme/tomorrow");
    ds_filter.session.setMode("ace/mode/json");
    ds_filter.renderer.setShowGutter(false);
    ds_filter.setShowPrintMargin(false);
    ds_filter.renderer.setScrollMargin(10, 10);
    ds_filter.setOption("displayIndentGuides", true);
    ds_filter.setOption("indentedSoftWrap", true);
    ds_filter.setOption("showLineNumbers", false);
    ds_filter.setOption("placeholder", "Search files");
    ds_filter.setOption("highlightActiveLine", false);
    ds_filter.commands.addCommand({
            name: "Do filter",
            bindKey: { win: "Enter", mac: "Enter" },
            exec: function () {
                      filter_ds_files();
            }
    });

    // Retrieve the datastore tree from the server and build the tree view
    get_request_api('/datastore/list/tree')
    .done(function (data){
        if(notify_auto_api(data, true)){
            $('#ds-tree-root').empty();
            build_ds_tree(data.data, 'ds-tree-root');
            reparse_activate_tree();
            show_datastore(do_set_events);
        }
    });
}

/**
 * Builds the datastore tree view recursively.
 * 
 * @param {Object} data - The data to build the tree from.
 * @param {string} tree_node - The ID of the HTML element to append the tree to.
 */
function build_ds_tree(data, tree_node) {
    // Define standard filters for the Ace editor
    var standard_files_filters = [
        {value: 'name: ', score: 10, meta: 'Match filename'},
        {value: 'storage_name: ', score: 10, meta: 'Match local storage filename'},
        {value: 'tag: ', score: 10, meta: 'Match tag of file'},
        {value: 'description: ', score: 10, meta: 'Match description of file'},
        {value: 'is_ioc: ', score: 10, meta: "Match file is IOC"},
        {value: 'is_evidence: ', score: 10, meta: "Match file is evidence"},
        {value: 'has_password: ', score: 10, meta: "Match file is password protected"},
        {value: 'id: ', score: 10, meta: "Match ID of the file"},
        {value: 'uuid: ', score: 10, meta: "Match UUID of the file"},
        {value: 'sha256: ', score: 10, meta: "Match sha256 of the file"},
        {value: 'AND ', score: 10, meta: 'AND operator'}
    ];

    // Loop through each node in the data
    for (let node in data) {
        // If the node is null, break the loop
        if (data[node] === null) {
            break;
        }

        // If the node is a directory, build the directory node and its children
        if (data[node].type == 'directory') {
            // Sanitize the directory name
            data[node].name = sanitizeHTML(data[node].name);
            // Set the delete option if the directory is not the root directory
            let can_delete = '';
            if (!data[node].is_root) {
                can_delete = `<div class="dropdown-divider"></div><a href="javascript:void(0);" class="dropdown-item text-danger ds-delete-folder"><small class="fa fa-trash mr-2"></small>Delete</a>`;
            }
            // Build the directory node
            let jnode = `<li  data-node-id="${node}">
                    <span id='${node}' title='Folder ID ${node}' data-node-id="${node}"><i class="fa-regular fa-folder"></i> ${data[node].name}</span> 
                    <i class="fas fa-plus ds-folder-menu" role="menu" style="cursor:pointer;" data-toggle="dropdown" aria-expanded="false"></i>
                    <div class="dropdown-menu" role="menu">
                            <a href="javascript:void(0);" class="dropdown-item ds-add-subfolder"><small class="fa-solid fa-folder mr-2"></small>Add subfolder</a>
                            <a href="javascript:void(0);" class="dropdown-item ds-add-file"><small class="fa-solid fa-file mr-2"></small>Add file</a>
                            <div class="dropdown-divider"></div>
                            <a href="javascript:void(0);" class="dropdown-item ds-move-folder"><small class="fa fa-arrow-right-arrow-left mr-2"></small>Move</a>
                            <a href="javascript:void(0);" class="dropdown-item ds-rename-folder" data-folder-name="${data[node].name}"><small class="fa-solid fa-pencil mr-2"></small>Rename</a>
                            ${can_delete}
                    </div>
                    <ul id='tree-${node}'></ul>
                </li>`;
            // Append the directory node to the tree
            $('#'+ tree_node).append(jnode);
            // Recursively build the children of the directory node
            build_ds_tree(data[node].children, 'tree-' + node);
        } else {
            // If the node is a file, build the file node
            // Sanitize the file name, password, and description
            data[node].file_original_name = sanitizeHTML(data[node].file_original_name);
            data[node].file_password = sanitizeHTML(data[node].file_password);
            data[node].file_description = sanitizeHTML(data[node].file_description);
            // Add the file to the standard filters for the Ace editor
            standard_files_filters.push({
                value: data[node].file_original_name,
                score: 1,
                meta: data[node].file_description
            });
            // Build the file icon based on its properties
            let icon = '';
            if (data[node].file_is_ioc) {
                icon += '<i class="fa-solid fa-virus-covid text-danger mr-1" title="File is an IOC"></i>';
            }
            if (data[node].file_is_evidence) {
                icon += '<i class="fa-solid fa-file-shield text-success mr-1" title="File is an evidence"></i>';
            }
            if (icon.length === 0) {
                icon = '<i class="fa-regular fa-file mr-1" title="Regular file"></i>';
            }
            // Build the file lock icon if the file is password protected
            let icon_lock = '';
            let has_password = data[node].file_password !== null && data[node].file_password.length > 0;
            if (has_password) {
                icon_lock = '<i title="Password protected" class="fa-solid fa-lock text-success mr-1"></i>'
            }
            // Encode the file icon and lock icon as base64
            let icn_content = btoa(icon + icon_lock);
            // Build the file node
            let jnode = `<li data-file-id="${node}">
                <span id='${node}' data-file-id="${node}" title="ID : ${data[node].file_id}\nUUID : ${data[node].file_uuid}" class='tree-leaf'>
                      <span role="menu" style="cursor:pointer;" data-toggle="dropdown" aria-expanded="false">${icon}${icon_lock} ${data[node].file_original_name}</span>
                      <i class="fa-regular fa-circle ds-file-selector" style="cursor:pointer;display:none;"></i>
                        <div class="dropdown-menu" role="menu">
                                <a href="#" class="dropdown-item ds-get-link-file-btn"><small class="fa fa-link mr-2"></small>Link</a>
                                <a href="#" class="dropdown-item ds-get-md-link-file-btn" data-file-name'${data[node].file_original_name}' data-file-icon='${icn_content}' data-has-password='${has_password}'><small class="fa-brands fa-markdown mr-2"></small>Markdown link</a>
                                <a href="#" class="dropdown-item ds-download-file-btn" data-file-name="${data[node].file_original_name}"><small class="fa-solid fa-download mr-2"></small>Download</a>
                                <div class="dropdown-divider"></div>
                                <a href="#" class="dropdown-item ds-info-file-btn"><small class="fa fa-eye mr-2"></small>Info</a>
                                <a href="#" class="dropdown-item ds-edit-file-btn"><small class="fa fa-pencil mr-2"></small>Edit</a>
                                <a href="#" class="dropdown-item ds-move-file-btn"><small class="fa fa-arrow-right-arrow-left mr-2"></small>Move</a>
                                <div class="dropdown-divider"></div>
                                <a href="#" class="dropdown-item text-danger ds-delete-file-btn"><small class="fa fa-trash mr-2"></small>Delete</a>
                        </div>
                    </span>
                </li>`;
            // Append the file node to the tree
            $('#'+ tree_node).append(jnode);
        } 
    }
    // Set up the Ace editor for the datastore file search with the standard filters
    ds_filter.setOptions({
        enableBasicAutocompletion: [{
            getCompletions: (editor, session, pos, prefix, callback) => {
                callback(null, standard_files_filters);
            },
        }],
        enableLiveAutocompletion: true,
    });
}

/**
 * Shows the datastore sidebar and sets events if specified.
 * 
 * @param {boolean} do_set_events - Whether to set events or not. Default is false.
 */
function show_datastore(do_set_events = false) {
    // Set events if specified
    if (do_set_events) {
        setOnClickEventFromMap(dsStoreEventsMap, dsClickEventNamespace);
    }
    // Add classes to show the sidebar
    $('html').addClass('ds_sidebar_open');
    $('.ds-sidebar-toggler').addClass('toggled');
}

/**
 * Hides the datastore sidebar and unsets events.
 */
function hide_datastore() {
    // Unset events
    unsetOnClickEventFromMap(dsStoreEventsMap, dsClickEventNamespace);
    // Remove classes to hide the sidebar
    $('html').removeClass('ds_sidebar_open');
    $('.ds-sidebar-toggler').removeClass('toggled');
}

/**
 * Adds classes and attributes to the tree view to show expand/collapse functionality.
 */
function reparse_activate_tree() {
    $('.tree li:has(ul)').addClass('parent_li').find(' > span').attr('title', 'Collapse this branch');
    $('.tree li.parent_li > span').on('click', function (e) {
        var children = $(this).parent('li.parent_li').find(' > ul > li');
        if (children.is(":visible")) {
            children.hide('fast');
            $(this).attr('title', 'Expand this branch').find(' > i').addClass('icon-plus-sign').removeClass('icon-minus-sign');
        } else {
            children.show('fast');
            $(this).attr('title', 'Collapse this branch').find(' > i').addClass('icon-minus-sign').removeClass('icon-plus-sign');
        }
        e.stopPropagation();
    });
}

/**
 * Opens a modal to add a new folder to the datastore.
 * 
 * @param {Object} parent_node - The parent node to add the new folder to.
 */
function add_ds_folder(parent_node) {
    // Set up the modal with the parent node and clear the input field
    $('#ds_mod_folder_name').data('parent-node', parent_node);
    $('#ds_mod_folder_name').data('node-update', false);
    $('#ds_mod_folder_name').val('');

    // Set up the click event for the save button
    $('#saveDsModFolder').off(dsClickEventNamespace).on(dsClickEventNamespace, function(e) {
        e.preventDefault();
        save_ds_mod_folder();
        return false;
    });

    // Show the modal
    $('#modal_ds_folder').modal("show");
}

/**
 * Opens a modal to rename a folder in the datastore.
 * 
 * @param {Object} parent_node - The parent node of the folder to rename.
 * @param {string} name - The current name of the folder to rename.
 */
function rename_ds_folder(parent_node, name) {
    // Set up the modal with the parent node and current name
    $('#ds_mod_folder_name').data('parent-node', parent_node);
    $('#ds_mod_folder_name').data('node-update', true);
    $('#ds_mod_folder_name').val(name);

    // Set up the click event for the save button
    $('#saveDsModFolder').off(dsClickEventNamespace).on(dsClickEventNamespace, function(e) {
        e.preventDefault();
        save_ds_mod_folder();
        return false;
    });

    // Show the modal
    $('#modal_ds_folder').modal("show");
}

/**
 * Prompts the user to confirm deletion of a datastore folder and its contents.
 * 
 * @param {string} node - The ID of the node to delete.
 */
function delete_ds_folder(node) {
    // Remove the 'd-' prefix from the node ID
    node = node.replace('d-', '');

    // Show a confirmation dialog using SweetAlert2
    swal({
        title: "Are you sure?",
        text: "This will delete all files included and sub-folders",
        icon: "warning",
        buttons: true,
        dangerMode: true
    })
    .then((willDelete) => {
        if (willDelete) {
            // If the user confirms, send a POST request to the server to delete the folder
            var data_sent = {
                "csrf_token": $('#csrf_token').val()
            }
            post_request_api('/datastore/folder/delete/' + node, JSON.stringify(data_sent))
            .done((data) => {
                if (notify_auto_api(data)) {
                    // If the deletion is successful, refresh the datastore
                    refresh_ds(true);
                }
            });
        } else {
            // If the user cancels, show a message using SweetAlert2
            swal("Pfew, that was close");
        }
    });
}

/**
 * Saves a new or renamed datastore folder.
 */
function save_ds_mod_folder() {
    // Create an object to hold the data to be sent to the server
    var data = Object();

    // Get the parent node ID and folder name from the modal input fields
    data['parent_node'] = $('#ds_mod_folder_name').data('parent-node').replace('d-', '');
    data['folder_name'] =  $('#ds_mod_folder_name').val();
    data['csrf_token'] = $('#csrf_token').val();

    // Set the URI for the POST request based on whether the folder is being added or renamed
    let uri = '/datastore/folder/add';
    if ($('#ds_mod_folder_name').data('node-update')) {
        uri = '/datastore/folder/rename/' + data['parent_node'];
    }

    // Send a POST request to the server to add or rename the folder
    post_request_api(uri, JSON.stringify(data))
    .done(function (data){
        if(notify_auto_api(data)){
            // If the request is successful, hide the modal and reload the datastore
            $('#modal_ds_folder').modal("hide");
            load_datastore();
        }
    });
}

/**
 * Shows the modal for adding a new datastore file.
 */
function showDSModalDSFile() {
    // Set up the toggle button for showing/hiding the file password
    $('#toggle_file_password').on('click', function () {
        const type = $('#file_password').attr('type') === 'password' ? 'text' : 'password';
        $('#file_password').attr('type', type);
        $('#toggle_file_password > i').attr('class', type === 'password' ? 'fa-solid fa-eye' : 'fa-solid fa-eye-slash');
    });

    // Set up the tag input field using amsifySuggestags plugin
    $('#file_tags').amsifySuggestags({
        printValues: true,
        whiteList: false,
        selectOnHover: false
    });

    // Set up the input field for selecting a file to upload
    $("#input_upload_ds_file").on("change", function(e) {
        var file = e.target.files[0].name;
        $('#file_original_name').val(file);
    });

    // Show the modal
    $('#modal_ds_file').modal("show");
}

/**
 * Opens a modal to add a new datastore file to the specified node.
 * 
 * @param {string} node - The ID of the node to add the file to.
 */
function add_ds_file(node) {
    // Remove the 'd-' prefix from the node ID
    node = node.replace('d-', '');

    // Set the URL for the modal content based on the node ID and case parameter
    const url = '/datastore/file/add/'+ node +'/modal' + case_param();

    // Load the modal content using AJAX
    $('#modal_ds_file_content').load(url, function (response, status, xhr) {
        if (status !== "success") {
             ajax_notify_error(xhr, url);
             return false;
        }

        // Set up the click event for the save button
        $('#dsModalSaveFileBtn')
        .off(dsClickEventNamespace)
        .on(dsClickEventNamespace, function(e) {
            e.preventDefault();
            save_ds_file(node, undefined);
            return false;
        });

        // Show the modal
        showDSModalDSFile();
    });
}

/**
 * Opens a modal to edit a datastore file.
 * 
 * @param {string} node - The ID of the node to edit.
 */
function edit_ds_file(node) {
    // Remove the 'f-' prefix from the node ID to get the file ID
    let file_id = node.replace('f-', '');

    // Set the URL for the modal content based on the file ID and case parameter
    const url = '/datastore/file/update/'+ file_id +'/modal' + case_param();

    // Load the modal content using AJAX
    $('#modal_ds_file_content').load(url, function (response, status, xhr) {
        if (status !== "success") {
             ajax_notify_error(xhr, url);
             return false;
        }

        // Set up the click event for the delete button
        $('#dsModalDeleteFileBtn')
        .off(dsClickEventNamespace)
        .on(dsClickEventNamespace, function(e) {
            e.preventDefault();
            delete_ds_file(file_id);
            return false;
        });

        // Set up the click event for the save button
        $('#dsModalSaveFileBtn')
        .off(dsClickEventNamespace)
        .on(dsClickEventNamespace, function(e) {
            e.preventDefault();
            let node_id = $(this).data('node-id');
            save_ds_file(node_id, file_id);
            return false;
        });

        // Show the modal
        showDSModalDSFile();
    });
}

/**
 * Opens a modal to show information about a datastore file.
 * 
 * @param {string} node - The ID of the node to show information about.
 */
function info_ds_file(node) {
    // Remove the 'f-' prefix from the node ID to get the file ID
    node = node.replace('f-', '');

    // Set the URL for the modal content based on the file ID and case parameter
    const url = '/datastore/file/info/'+ node +'/modal' + case_param();

    // Load the modal content using AJAX
    $('#modal_ds_file_content').load(url, function (response, status, xhr) {
        if (status !== "success") {
             ajax_notify_error(xhr, url);
             return false;
        }

        // Show the modal
        $('#modal_ds_file').modal("show");
    });
}

/**
 * Saves a new or updated datastore file.
 * 
 * @param {string} node - The ID of the node to add the file to.
 * @param {string} file_id - The ID of the file to update, if applicable.
 */
function save_ds_file(node, file_id) {
    // Create a new FormData object with the data from the form
    var formData = new FormData($('#form_new_ds_file')[0]);
    // Append the file content to the FormData object
    formData.append('file_content', $('#input_upload_ds_file').prop('files')[0]);

    // Set the URI for the POST request based on whether the file is being added or updated
    var uri = '/datastore/file/update/' + file_id;
    if (file_id === undefined) {
        uri = '/datastore/file/add/' + node;
    } 

    // Send a POST request to the server to add or update the file
    post_request_data_api(uri, formData, true, function() {
        // Show a loading dialog using SweetAlert2
        window.swal({
              title: "File is uploading",
              text: "Please wait. This window will close automatically when the file is uploaded.",
              icon: "/static/assets/img/loader.gif",
              button: false,
              allowOutsideClick: false
        });
    })
    .done(function (data){
        if(notify_auto_api(data)){
            // If the request is successful, hide the modal and refresh the datastore
            $('#modal_ds_file').modal("hide");
            refresh_ds(true);
        }
    })
    .always(() => {
        // Close the loading dialog using SweetAlert2
        window.swal.close();
    });
}

/**
 * Refreshes the datastore by resetting the file view and reloading the datastore.
 * 
 * @param {boolean} silent - Whether to show a success notification.
 */
function refresh_ds(silent = false){
    // Remove any click events from the datastore map
    unsetOnClickEventFromMap(dsStoreEventsMap, dsClickEventNamespace);
    
    // Reset the file view and load the datastore
    reset_ds_file_view();
    load_datastore(true);

    // Show a success notification, if applicable
    if (!silent){
        notify_success('Datastore refreshed');
    }
}

/**
 * Toggles the file selection mode in the datastore.
 */
function toggle_select_file() {
    if ($('.btn-ds-bulk-selector').hasClass('active')) {
        // If the file selection mode is active, refresh the datastore
        refresh_ds(true);
    } else {
        // If the file selection mode is inactive, show the file selector and bulk actions
        $('.ds-file-selector').show(250);
        $('.btn-ds-bulk').show(250);
        $('.btn-ds-bulk-selector').addClass('active');
    }
}

/**
 * Moves a datastore file to a new location.
 * 
 * @param {string} file_id - The ID of the file to move.
 */
function move_ds_file(file_id) {
    // Activate the tree selection and show the file selector
    reparse_activate_tree_selection();
    $('.ds-file-selector').show();
    // Set the destination folder message to "unselected destination"
    $('#msg_mv_dst_folder').text('unselected destination');
    $('#msg_select_destination_folder').show();

    // Select the file to move
    ds_file_select(file_id);
}

/**
 * Resets the datastore file view by removing all selected nodes and files, hiding the file selector and bulk actions, and resetting the destination folder message.
 */
function reset_ds_file_view() {
    // Remove the 'node-selected' and 'file-selected' classes from all selected nodes and files
    $(".node-selected").removeClass("node-selected");
    $(".file-selected").removeClass("file-selected");

    // Hide the file selector and reset the destination folder message
    $('.ds-file-selector').hide();
    $('#msg_select_destination_folder').attr("data-file-id", '');
    $('#msg_select_destination_folder').hide();
    $('#msg_select_destination_folder_folder').hide();

    // Hide the bulk actions
    $('.btn-ds-bulk').hide();
    $('.btn-ds-bulk-selector').removeClass('active');
}

/**
 * Toggles the selection of a datastore file.
 * 
 * @param {string} file_id - The ID of the file to select.
 */
function ds_file_select(file_id) {
    // Add or remove the 'file-selected' class from the selected file
    file_id = '#'+ file_id;
    if ($(file_id).hasClass('file-selected')) {
        $(file_id + '> i').removeClass('fa-circle-check');
        $(file_id + '> i').addClass('fa-circle');
        $(file_id).removeClass('file-selected');
    } else {
        $(file_id+ '> i').removeClass('fa-circle');
        $(file_id+ '> i').addClass('fa-circle-check');
        $(file_id).addClass('file-selected');
    }

    // Update the message indicating the number of selected files
    $('#msg_mv_files').text($('.file-selected').length);
}

/**
 * Validates the selection of a destination folder and files to move, and sends a POST request to the server to move the selected files.
 */
function validate_ds_file_move() {
    // Create an object with the data to send
    var data_sent = Object();

    // Check if a destination folder and files to move have been selected
    if ($(".node-selected").length === 0) {
        notify_error('No destination folder selected');
        return false;
    }
    if ($(".file-selected").length === 0) {
        notify_error('No file to move selected');
        return false;
    }

    // Set the destination folder and CSRF token in the data object
    data_sent['destination-node'] = $(".node-selected").data('node-id').replace('d-', '');
    data_sent['csrf_token'] = $('#csrf_token').val();

    // Send a POST request to the server to move each selected file
    let selected_files = $(".file-selected");
    selected_files.each((index) => {
        let file_id = $(selected_files[index]).data('file-id').replace('f-', '');
        post_request_api('/datastore/file/move/' + file_id, JSON.stringify(data_sent))
        .done((data) => {
            if (notify_auto_api(data)) {
                // If the request is successful, refresh the datastore
                if (index == $(".file-selected").length - 1) {
                    refresh_ds(true);
                }
                index +=1;
            }
        });
    });
}

/**
 * Moves a datastore folder to a new location.
 * 
 * @param {string} node_id - The ID of the folder to move.
 */
function move_ds_folder(node_id) {
    // Reset the datastore file view
    reset_ds_file_view();

    // Set the source folder message and show the destination folder selector
    $('#msg_mv_folder').text($('#' + node_id).text());
    $('#msg_mv_dst_folder_folder').text('unselected destination');
    $('#msg_select_destination_folder_folder').show();

    // Activate the tree selection and select the source folder
    reparse_activate_tree_selection();
    $('#' + node_id).addClass('node-source-selected');
}

/**
 * Validates the selection of a destination folder and a source folder to move, and sends a POST request to the server to move the source folder.
 */
function validate_ds_folder_move() {
    // Create an object with the data to send
    var data_sent = Object();

    // Check if a destination folder and a source folder to move have been selected
    if ($(".node-selected").length === 0) {
        notify_error('No destination folder selected');
        return false;
    }
    if ($(".node-source-selected").length === 0) {
        notify_error('No initial folder to move');
        return false;
    }

    // Set the destination folder and CSRF token in the data object
    data_sent['destination-node'] = $(".node-selected").data('node-id').replace('d-', '');
    data_sent['csrf_token'] = $('#csrf_token').val();

    // Send a POST request to the server to move the source folder
    const node_id = $(".node-source-selected").data('node-id').replace('d-', '');
    post_request_api('/datastore/folder/move/' + node_id, JSON.stringify(data_sent))
    .done((data) => {
        if (notify_auto_api(data)) {
            // If the request is successful, refresh the datastore
            refresh_ds(true);
        }
    });
}

/**
 * Deletes a datastore file.
 * 
 * @param {string} file_id - The ID of the file to delete.
 */
function delete_ds_file(file_id) {
    // Remove the 'f-' prefix from the file ID
    file_id = file_id.replace('f-', '');

    // Show a confirmation dialog to the user
    swal({
        title: "Are you sure?",
        text: "This will delete the file on the server and any manual reference will become invalid",
        icon: "warning",
        buttons: true,
        dangerMode: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes, delete it!'
    })
    .then((willDelete) => {
        if (willDelete) {
            // Create an object with the data to send
            var data_sent = {
                "csrf_token": $('#csrf_token').val()
            }

            // Send a POST request to the server to delete the file
            post_request_api('/datastore/file/delete/' + file_id, JSON.stringify(data_sent))
            .done((data) => {
                if (notify_auto_api(data)) {
                    // If the request is successful, refresh the datastore
                    refresh_ds(true);
                }
            });
        } else {
            swal("Pfew, that was close");
        }
    });
}

/**
 * Deletes multiple datastore files.
 */
function delete_bulk_ds_file() {
    // Get all selected files
    let selected_files = $(".file-selected");

    // Show a confirmation dialog to the user
    swal({
        title: "Are you sure?",
        text: `You are about to delete ${selected_files.length} files\nThis will delete the files on the server and any manual reference will become invalid`,
        icon: "warning",
        buttons: true,
        dangerMode: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes, delete it!'
    })
    .then((willDelete) => {
        if (willDelete) {
            // Send a POST request to the server to delete each selected file
            selected_files.each((index) => {
                const file_id = $(selected_files[index]).data('file-id').replace('f-', '');
                var data_sent = {
                    "csrf_token": $('#csrf_token').val()
                }
                post_request_api('/datastore/file/delete/' + file_id, JSON.stringify(data_sent))
                .done((data) => {
                    if (notify_auto_api(data)) {
                        // If the request is successful and it is the last file, refresh the datastore
                        if (index == $(".file-selected").length - 1) {
                            refresh_ds(true);
                        }
                        index +=1;
                    }
                });
            });
        } else {
            swal("Pfew, that was close");
        }
    });
}

/**
 * Copies the link to view a datastore file to the user's clipboard and displays a success or error notification.
 * 
 * @param {string} file_id - The ID of the file to get the link for.
 */
function get_link_ds_file(file_id) {
   // Remove the 'f-' prefix from the file ID
   file_id = file_id.replace('f-', '');

   // Build the link to view the file and add the case parameter
   let link = location.protocol + '//' + location.host + '/datastore/file/view/' + file_id;
   link = link + case_param();

   // Copy the link to the user's clipboard and display a success or error notification
   navigator.clipboard.writeText(link).then(function() {
          notify_success('File link copied')
    }, function(err) {
        notify_error('Unable to copy link. Error ' + err);
        console.error('File link link', err);
    });
}

/**
 * Builds the link to view a datastore file.
 * 
 * @param {string} file_id - The ID of the file to get the link for.
 * @returns {string} The link to view the file.
 */
function build_dsfile_view_link(file_id) {
   // Remove the 'f-' prefix from the file ID
   file_id = file_id.replace('f-', '');

   // Build the link to view the file and add the case parameter
   let link = '/datastore/file/view/' + file_id;
   link = link + case_param();

   return link;
}
/**
 * Copies the markdown link to view a datastore file to the user's clipboard and displays a success or error notification.
 * 
 * @param {string} file_id - The ID of the file to get the link for.
 * @param {string} filename - The name of the file.
 * @param {string} file_icon - The icon of the file.
 * @param {string} has_password - Whether the file has a password or not.
 */
function get_mk_link_ds_file(file_id, filename, file_icon, has_password) {
   // Build the link to view the file
   let link = build_dsfile_view_link(file_id);

   // Decode the file icon
   file_icon = atob(file_icon);

   // Build the markdown link
   let mk_link = `[${file_icon} [DS] ${filename}](${link})`;

   // If the file does not have a password and is an image, build a markdown image link instead
   if (has_password == 'false' && ['png', 'svg', 'jpeg', 'jpg', 'webp', 'bmp', 'gif'].includes(filename.split('.').pop())) {
        mk_link = `![${filename}](${link} =40%x40%)`;
    }

   // Copy the markdown link to the user's clipboard and display a success or error notification
   navigator.clipboard.writeText(mk_link).then(function() {
          notify_success('Markdown file link copied')
    }, function(err) {
        notify_error('Unable to copy link. Error ' + err);
        console.error(`Markdown file link ${mk_link}`, err);
    });
}

/**
 * Downloads a datastore file.
 * 
 * @param {string} file_id - The ID of the file to download.
 * @param {string} filename - The name of the file.
 */
function download_ds_file(file_id, filename) {
    // Build the link to download the file
    const link = build_dsfile_view_link(file_id);
    // Download the file
    downloadURI(link, filename);
}

/**
 * Activates the tree selection for the datastore sidebar.
 */
function reparse_activate_tree_selection() {
    // Set a click event listener on the tree nodes
    $('.tree li.parent_li > span').on('click', function () {
        if ($(this).hasClass('node-selected')) {
            // If the node is already selected, deselect it and update the destination folder message
            $(this).removeClass('node-selected');
            $('#msg_mv_dst_folder').text('unselected destination');
            $('#msg_mv_dst_folder_folder').text('unselected destination');
        } else {
            // If the node is not selected, deselect all other nodes, select it and update the destination folder message
            $(".node-selected").removeClass("node-selected");
            $(this).addClass('node-selected');
            $('#msg_mv_dst_folder').text($(".node-selected").text());
            $('#msg_mv_dst_folder_folder').text($(".node-selected").text());
        }
    });
}

/**
 * Parses a filter string and stores the parsed values in an object.
 * 
 * @param {string} str_filter - The filter string to parse.
 * @param {Array} keywords - An array of keywords to look for in the filter string.
 * @returns {boolean} True if the filter string was successfully parsed, false otherwise.
 */
let parsed_filter_ds = {};
function parse_filter(str_filter, keywords) {
  // Loop through each keyword in the array
  for (var k = 0; k < keywords.length; k++) {
    let keyword = keywords[k];
    let items = str_filter.split(keyword + ':');

    let ita = items[1];

    // If the keyword is not found in the filter string, continue to the next keyword
    if (ita === undefined) {
        continue;
    }

    // Split the value of the keyword by boolean operators and store the resulting array in item
    let item = split_bool(ita);

    // If the resulting array is not null, store the values in the parsed_filter_ds object
    if (item != null) {
      if (!(keyword in parsed_filter_ds)) {
        parsed_filter_ds[keyword] = [];
      }
      if (!parsed_filter_ds[keyword].includes(item)) {
        parsed_filter_ds[keyword].push(item.trim());
      }

      // Remove the keyword and its value from the filter string and recursively call parse_filter with the updated string
      if (items[1] != undefined) {
        str_filter = str_filter.replace(keyword + ':' + item, '');
        if (parse_filter(str_filter, keywords)) {
            keywords.shift();
        }
      }
    }
  }
  return true;
}

/**
 * Filters the datastore files based on the filter string entered by the user.
 */
function filter_ds_files() {
    // Define an array of keywords to look for in the filter string
    const ds_keywords = ['storage_name', 'name', 'tag', 'description', 'is_ioc', 'is_evidence', 'has_password', 'uuid', 'id', 'sha256'];
    // Initialize an empty object to store the parsed filter values
    parsed_filter_ds = {};
    // Parse the filter string and store the parsed values in the parsed_filter_ds object
    parse_filter(ds_filter.getValue(), ds_keywords);
    // Encode the parsed filter values as a query string
    let filter_query = encodeURIComponent(JSON.stringify(parsed_filter_ds));

    // Update the search button text to indicate that the search is in progress
    $('#dsFilterDSFile').text('Searching..');
    // Send a GET request to the API to retrieve the filtered datastore files
    get_request_data_api("/datastore/list/filter",{ 'q': filter_query })
    .done(function (data){
        // If the API request is successful, build the datastore tree with the filtered files and show the datastore
        if(notify_auto_api(data, true)){
            $('#ds-tree-root').empty();
            build_ds_tree(data.data, 'ds-tree-root');
            reparse_activate_tree();
            show_datastore();
        }
    })
    .always(() => {
        // Update the search button text to indicate that the search is complete
        $('#dsFilterDSFile').text('Search');
    });
}

/**
 * Resets the datastore file filter to its default state.
 */
function reset_ds_files_filter() {
    // Clear the filter input field and reload the datastore
    ds_filter.setValue("");
    load_datastore();
}

/**
 * Shows the help modal for the datastore filter.
 */
function show_ds_filter_help() {
    // Load the help modal for the datastore filter and display it
    $('#modal_help').load('/datastore/filter-help/modal' + case_param(), function (response, status, xhr) {
        if (status !== "success") {
             ajax_notify_error(xhr, '/datastore/filter-help/modal');
             return false;
        }
        $('#modal_help').modal('show');
    });
}

$(function() {
    // Set a click event listener on the datastore sidebar toggler
    $('.ds-sidebar-toggler').on('click', function() {
        // Load the datastore with the sidebar open
        load_datastore(true);
    });

    // Set a click event listener on the close button for the datastore sidebar
    $('.close-ds-sidebar').on('click', function() {
        // Hide the datastore sidebar
        hide_datastore();
    });
});