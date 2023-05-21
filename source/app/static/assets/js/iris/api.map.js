export const roots = {
    case: "/case",
    context: "/context",
    datastore: "/datastore",
    dim: "/dim",
    user: "/user",
}


export const endpoints = {
    // Case
    case: {
        root: roots.case,
        // List activities related to a case
        activities_list: roots.case + "/activities/list",
        add_task_log: roots.case + "/tasklog/add",
    },

    // Context
    context: {
        root: roots.case,
        get_cases: roots.context + "/get-cases/", // + Number of results
        search_cases: roots.context + "/search-cases",
        set: roots.context + "/set",
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

    // User 
    user: {
        root: roots.user,
        whoami: roots.user + "/whoami",
        set_mini_siderbar: roots.user + "/mini-sidebar/set/true",
        unset_mini_siderbar: roots.user + "/mini-sidebar/set/false",
    }
};