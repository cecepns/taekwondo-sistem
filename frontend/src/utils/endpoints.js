export const API_ENDPOINTS = {
  DASHBOARD: {
    STATS: "/dashboard",
  },
  AUTH: {
    LOGIN: "/auth/login",
    PROFILE: "/auth/profile",
  },
  SETTINGS: {
    GET: "/settings",
    UPDATE: "/settings",
  },
  BELTS: {
    LIST: "/belts",
    CREATE: "/belts",
  },
  CLASSES: {
    LIST: "/classes",
    CREATE: "/classes",
  },
  MEMBERS: {
    LIST: "/members",
    DETAIL: (id) => `/members/${id}`,
    CREATE: "/members",
    UPDATE: (id) => `/members/${id}`,
    DELETE: (id) => `/members/${id}`,
  },
  DUES: {
    LIST: "/dues",
    PAY: "/dues/pay",
    DETAIL: (id) => `/dues/${id}`,
    UNPAID: "/dues/unpaid",
  },
  SESSIONS: {
    LIST: "/sessions",
    CREATE: "/sessions",
    DETAIL: (id) => `/sessions/${id}`,
  },
  COACHES: {
    LIST: "/coaches",
    CREATE: "/coaches",
    DETAIL: (id) => `/coaches/${id}`,
  },
  ATTENDANCE: {
    MEMBER_SUBMIT: "/attendance/members",
    MEMBER_LIST: "/attendance/members",
    COACH_SUBMIT: "/attendance/coach",
  },
  PROGRAMS: {
    LIST: "/programs",
    CREATE: "/programs",
    DETAIL: (id) => `/programs/${id}`,
  },
  PHYSICAL_TESTS: {
    TYPES_LIST: "/physical-tests/types",
    TYPES_CREATE: "/physical-tests/types",
    RESULTS_LIST: "/physical-tests/results",
    RESULTS_CREATE: "/physical-tests/results",
    RESULTS_DETAIL: (id) => `/physical-tests/results/${id}`,
  },
  CHAMPIONSHIPS: {
    LIST: "/championships",
    CREATE: "/championships",
    DETAIL: (id) => `/championships/${id}`,
    VALIDATE_WEIGHT: "/championships/validate-weight",
    PARTICIPANTS_LIST: "/championships/participants",
    PARTICIPANTS_CREATE: "/championships/participants",
    PARTICIPANTS_DETAIL: (id) => `/championships/participants/${id}`,
    CLASSES_LIST: "/championships/classes",
    PARTICIPANTS: (id) => `/championships/${id}/participants`,
    WEIGH_IN: (id) => `/championships/participants/${id}/weigh-in`,
    WEIGH_IN_HISTORY: (id) => `/championships/participants/${id}/weigh-in-history`,
    CATEGORIES: '/championship-categories',
    CATEGORY_DETAIL: (id) => `/championship-categories/${id}`,
    AGE_GROUPS: '/championship-age-groups',
    AGE_GROUP_DETAIL: (id) => `/championship-age-groups/${id}`
  },
  REPORTS: {
    HONOR: "/reports/honor",
    HONOR_DETAIL: (id) => `/reports/honor/${id}`,
  },
  BACKUP: {
    JSON: "/backup/json",
    SQL: "/backup/sql",
    RESTORE: "/restore/json",
  }
};
