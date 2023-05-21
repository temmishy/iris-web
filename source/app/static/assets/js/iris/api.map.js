const roots = {
    case: "/case",
    context: "/context",
    dashboard: "/dashboard",
    datastore: "/datastore",
    dim: "/dim",
    global_tasks: "/global/tasks",
    overview: "/overview",
    manage: "/manage",
    user: "/user",
}


const endpoints = {
    // Case
    case: {
        root: roots.case,
        // List activities related to a case
        activities_list: roots.case + "/activities/list",
        add_task_log: roots.case + "/tasklog/add",
        details: roots.case + "/details/", // + case id
        pipeline: {
            modal: roots.case + "/pipelines-modal",
        },
        report: {
            gen_investigation: roots.case + "/report/generate-investigation/", // report template id
            gen_activities: roots.case + "/report/generate-activities/", // report template id
        },
        summary: {
            get: roots.case + "/summary/fetch",
            set: roots.case + "/summary/update",
        },
        tasks: {
            root: roots.case + "/tasks",
        }
    },

    // Context
    context: {
        root: roots.case,
        get_cases: roots.context + "/get-cases/", // + Number of results
        search_cases: roots.context + "/search-cases",
        set: roots.context + "/set",
    },

    // Dashboard 
    dashboard: {
        root: roots.dashboard,
        case_charts: roots.dashboard + "/case_charts",
    }, 

    // Datastore
    ds: {
        root: roots.datastore,
        add_file_interactive: roots.datastore + "/file/add-interactive",
    },

    // Dim tasks
    dim: {
        root: roots.dim,
        tasks_status: "/dim/tasks/status", // + ID of the task
        list_tasks: "/dim/tasks/list", // + number of results
        hooks_options: "/dim/hooks/options/", // + hook type
    },

    // Global tasks
    global_tasks: {
        root: roots.global_tasks,
        add_modal: roots.global_tasks + "/add/modal",
        add: roots.global_tasks + "/add",
        list: roots.global_tasks + "/list",
        update: roots.global_tasks + "/update/", // + task id
        delete: roots.global_tasks + "/delete/" // + task id
    },

    // Manage
    manage: {
        root: roots.manage,
        cases: {
            view: roots.manage + "/cases", // + case id in cid and #view in hash
        }
    },

    // Overview
    overview: {
        root: roots.overview,
        filter: roots.overview + "/filter",
    },

    // User 
    user: {
        root: roots.user,
        whoami: roots.user + "/whoami",
        set_mini_siderbar: roots.user + "/mini-sidebar/set/true",
        unset_mini_siderbar: roots.user + "/mini-sidebar/set/false",
        list_tasks: roots.user + "/tasks/list",
        update_task_status: roots.user + "/tasks/status/update",
    }
};

// Export the API map
export default endpoints;