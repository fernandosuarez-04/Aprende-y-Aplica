export declare const HTTP_STATUS: {
    readonly OK: 200;
    readonly CREATED: 201;
    readonly NO_CONTENT: 204;
    readonly BAD_REQUEST: 400;
    readonly UNAUTHORIZED: 401;
    readonly FORBIDDEN: 403;
    readonly NOT_FOUND: 404;
    readonly CONFLICT: 409;
    readonly UNPROCESSABLE_ENTITY: 422;
    readonly TOO_MANY_REQUESTS: 429;
    readonly INTERNAL_ERROR: 500;
    readonly SERVICE_UNAVAILABLE: 503;
};
export declare const ERROR_CODES: {
    readonly AUTHENTICATION_ERROR: "AUTHENTICATION_ERROR";
    readonly INVALID_CREDENTIALS: "INVALID_CREDENTIALS";
    readonly MISSING_TOKEN: "MISSING_TOKEN";
    readonly INVALID_TOKEN: "INVALID_TOKEN";
    readonly TOKEN_EXPIRED: "TOKEN_EXPIRED";
    readonly INVALID_FINGERPRINT: "INVALID_FINGERPRINT";
    readonly VALIDATION_ERROR: "VALIDATION_ERROR";
    readonly INVALID_INPUT: "INVALID_INPUT";
    readonly MISSING_REQUIRED_FIELD: "MISSING_REQUIRED_FIELD";
    readonly INVALID_EMAIL: "INVALID_EMAIL";
    readonly INVALID_PASSWORD: "INVALID_PASSWORD";
    readonly INSUFFICIENT_PERMISSIONS: "INSUFFICIENT_PERMISSIONS";
    readonly UNAUTHORIZED_ACCESS: "UNAUTHORIZED_ACCESS";
    readonly NOT_FOUND: "NOT_FOUND";
    readonly RESOURCE_NOT_FOUND: "RESOURCE_NOT_FOUND";
    readonly DUPLICATE_RESOURCE: "DUPLICATE_RESOURCE";
    readonly USER_NOT_FOUND: "USER_NOT_FOUND";
    readonly COURSE_NOT_FOUND: "COURSE_NOT_FOUND";
    readonly MODULE_NOT_FOUND: "MODULE_NOT_FOUND";
    readonly VIDEO_NOT_FOUND: "VIDEO_NOT_FOUND";
    readonly INTERNAL_ERROR: "INTERNAL_ERROR";
    readonly DATABASE_ERROR: "DATABASE_ERROR";
    readonly EXTERNAL_SERVICE_ERROR: "EXTERNAL_SERVICE_ERROR";
    readonly OPENAI_API_ERROR: "OPENAI_API_ERROR";
    readonly RATE_LIMIT_EXCEEDED: "RATE_LIMIT_EXCEEDED";
    readonly FILE_TOO_LARGE: "FILE_TOO_LARGE";
    readonly INVALID_FILE_TYPE: "INVALID_FILE_TYPE";
    readonly UPLOAD_FAILED: "UPLOAD_FAILED";
    readonly MODULE_LOCKED: "MODULE_LOCKED";
    readonly COURSE_NOT_ACCESSIBLE: "COURSE_NOT_ACCESSIBLE";
    readonly PROGRESS_UPDATE_FAILED: "PROGRESS_UPDATE_FAILED";
    readonly QUESTION_NOT_FOUND: "QUESTION_NOT_FOUND";
    readonly ANSWER_NOT_FOUND: "ANSWER_NOT_FOUND";
    readonly ALREADY_VOTED: "ALREADY_VOTED";
    readonly CANNOT_VOTE_OWN_CONTENT: "CANNOT_VOTE_OWN_CONTENT";
};
export declare const USER_ROLES: {
    readonly ADMIN: "admin";
    readonly USER: "user";
    readonly GUEST: "guest";
};
export declare const COURSE_STATUS: {
    readonly DRAFT: "draft";
    readonly PUBLISHED: "published";
    readonly ARCHIVED: "archived";
};
export declare const MODULE_STATUS: {
    readonly LOCKED: "locked";
    readonly AVAILABLE: "available";
    readonly IN_PROGRESS: "in_progress";
    readonly COMPLETED: "completed";
};
export declare const COURSE_DIFFICULTY: {
    readonly BEGINNER: "beginner";
    readonly INTERMEDIATE: "intermediate";
    readonly ADVANCED: "advanced";
};
export declare const BUSINESS_RULES: {
    readonly JWT_EXPIRY_DAYS: 7;
    readonly REFRESH_TOKEN_EXPIRY_DAYS: 30;
    readonly FINGERPRINT_REQUIRED: true;
    readonly VIDEO_COMPLETION_THRESHOLD: 90;
    readonly MODULE_UNLOCK_THRESHOLD: 90;
    readonly PASSING_SCORE: 70;
    readonly MAX_FILE_SIZE: 10485760;
    readonly USER_STORAGE_LIMIT: 1073741824;
    readonly API_RATE_LIMIT: 1000;
    readonly MAX_QUESTION_TITLE_LENGTH: 200;
    readonly MAX_QUESTION_CONTENT_LENGTH: 5000;
    readonly MAX_ANSWER_CONTENT_LENGTH: 5000;
    readonly MAX_COURSE_TITLE_LENGTH: 150;
    readonly MAX_COURSE_DESCRIPTION_LENGTH: 1000;
};
export declare const API_ENDPOINTS: {
    readonly AUTH: {
        readonly LOGIN: "/auth/login";
        readonly REGISTER: "/auth/register";
        readonly REFRESH: "/auth/refresh";
        readonly LOGOUT: "/auth/logout";
        readonly FORGOT_PASSWORD: "/auth/forgot-password";
        readonly RESET_PASSWORD: "/auth/reset-password";
        readonly VERIFY_EMAIL: "/auth/verify-email";
    };
    readonly USERS: {
        readonly PROFILE: "/users/profile";
        readonly UPDATE_PROFILE: "/users/profile";
        readonly AVATAR: "/users/avatar";
        readonly PREFERENCES: "/users/preferences";
    };
    readonly COURSES: {
        readonly LIST: "/courses";
        readonly DETAIL: "/courses/:id";
        readonly MODULES: "/courses/:id/modules";
        readonly PROGRESS: "/courses/:id/progress";
        readonly ENROLL: "/courses/:id/enroll";
        readonly UNENROLL: "/courses/:id/unenroll";
    };
    readonly MODULES: {
        readonly DETAIL: "/modules/:id";
        readonly VIDEOS: "/modules/:id/videos";
        readonly PROGRESS: "/modules/:id/progress";
        readonly UNLOCK: "/modules/:id/unlock";
    };
    readonly VIDEOS: {
        readonly DETAIL: "/videos/:id";
        readonly PROGRESS: "/videos/:id/progress";
        readonly UPDATE_PROGRESS: "/videos/:id/progress";
    };
    readonly COMMUNITY: {
        readonly QUESTIONS: "/community/questions";
        readonly QUESTION_DETAIL: "/community/questions/:id";
        readonly ANSWERS: "/community/questions/:id/answers";
        readonly VOTES: "/community/questions/:id/votes";
        readonly SEARCH: "/community/search";
    };
    readonly CHAT_LIA: {
        readonly SESSIONS: "/chat-lia/sessions";
        readonly MESSAGES: "/chat-lia/sessions/:id/messages";
        readonly SEND_MESSAGE: "/chat-lia/sessions/:id/messages";
        readonly SUGGESTIONS: "/chat-lia/suggestions";
    };
    readonly EVALUATIONS: {
        readonly LIST: "/evaluations";
        readonly DETAIL: "/evaluations/:id";
        readonly ATTEMPT: "/evaluations/:id/attempt";
        readonly RESULT: "/evaluations/:id/result";
    };
    readonly ADMIN: {
        readonly USERS: "/admin/users";
        readonly COURSES: "/admin/courses";
        readonly ANALYTICS: "/admin/analytics";
        readonly REPORTS: "/admin/reports";
    };
};
export declare const ALLOWED_FILE_TYPES: readonly ["image/jpeg", "image/png", "image/gif", "image/webp", "application/pdf", "text/plain", "text/csv", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
export declare const PAGINATION: {
    readonly DEFAULT_PAGE: 1;
    readonly DEFAULT_LIMIT: 10;
    readonly MAX_LIMIT: 100;
};
export declare const UI_CONSTANTS: {
    readonly ANIMATION_DURATION: 300;
    readonly DEBOUNCE_DELAY: 500;
    readonly TOAST_DURATION: 5000;
    readonly MODAL_ANIMATION_DURATION: 200;
};
//# sourceMappingURL=index.d.ts.map