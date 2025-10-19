export var UserRole;
(function (UserRole) {
    UserRole["ADMIN"] = "admin";
    UserRole["USER"] = "user";
    UserRole["GUEST"] = "guest";
})(UserRole || (UserRole = {}));
export var CourseStatus;
(function (CourseStatus) {
    CourseStatus["DRAFT"] = "draft";
    CourseStatus["PUBLISHED"] = "published";
    CourseStatus["ARCHIVED"] = "archived";
})(CourseStatus || (CourseStatus = {}));
export var CourseDifficulty;
(function (CourseDifficulty) {
    CourseDifficulty["BEGINNER"] = "beginner";
    CourseDifficulty["INTERMEDIATE"] = "intermediate";
    CourseDifficulty["ADVANCED"] = "advanced";
})(CourseDifficulty || (CourseDifficulty = {}));
// Enums adicionales
export var NotificationType;
(function (NotificationType) {
    NotificationType["INFO"] = "info";
    NotificationType["SUCCESS"] = "success";
    NotificationType["WARNING"] = "warning";
    NotificationType["ERROR"] = "error";
})(NotificationType || (NotificationType = {}));
export var VoteType;
(function (VoteType) {
    VoteType["UP"] = "up";
    VoteType["DOWN"] = "down";
})(VoteType || (VoteType = {}));
export var MessageRole;
(function (MessageRole) {
    MessageRole["USER"] = "user";
    MessageRole["ASSISTANT"] = "assistant";
})(MessageRole || (MessageRole = {}));
export var QuestionType;
(function (QuestionType) {
    QuestionType["MULTIPLE_CHOICE"] = "multiple_choice";
    QuestionType["TEXT"] = "text";
})(QuestionType || (QuestionType = {}));
// Tipos de Contenido para Landing Page
export * from './content';
//# sourceMappingURL=index.js.map