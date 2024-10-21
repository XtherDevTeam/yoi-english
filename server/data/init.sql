create table users (
    id                      integer primary key autoincrement,
    username                string not null,
    passwordSalted          string not null,
    email                   string not null,
    oralExamQuota           integer not null default 100,
    oralExamResultViewQuota integer not null default 100,
    -- 8 bit integer to represent permission
    -- the first digit represents the ability to create new exam paper
    -- the second digit represents the ability to create new artifact
    -- the third digit represents the ability to view other user's exam result
    -- the fourth digit represents the ability to view user's own exam result
    -- the fifth digit represents the ability to read/write and remove user's own artifact
    -- the eighth digit represents the administrator permission
    permission              integer not null default 0,
    avatar                  blob not null,
    avatarMime              string not null default 'image/png'
);

create table config (
    chatbotName         string not null,
    chatbotPersona      string not null,
    chatbotAvatar       blob not null,
    chatbotAvatarMime   string not null default 'image/png',
    enableRegister      integer not null default 1,
    googleApiKey        string not null
);

create table oralEnglishExamResult (
    id                        integer primary key autoincrement,
    completeTime              integer not null,
    band                      integer not null,
    overallFeedback           string not null,
    grammarFeedback           string not null,
    pronunciationFeedback     string not null,
    vocabularyFeedback        string not null,
    fluencyFeedback          string not null,
    chats                     string not null default '[]',
    userId                    integer not null
);

create table artifact (
    id            integer primary key autoincrement,
    content       blob not null,
    mimetype      string not null,
    expireTime    integer not null,
    userId        integer not null
);

create table academicalPassageExamPaper (
    id                  integer primary key autoincrement,
    createTime          integer not null,
    userId              integer not null,
    -- store markdown content of the paper
    passages            string not null,
    -- json string of the answer sheet format
    answerSheetFormat   string not null,
    answers             string not null,
    duration            integer not null
);

create table academicalPassageExamResult (
    id                  integer primary key autoincrement,
    -- store the id of the exam paper
    completeTime        integer not null,
    examPaperId         integer not null,
    answerSheet         string not null,
    -- store the user's score
    correctAnsCount     integer not null,
    band                integer not null,
    -- store the user's feedback
    feedback            string not null,
    userId              integer not null
);

create table essayWritingExamResult (
    id                  integer primary key autoincrement,
    -- store the id of the exam paper
    completeTime        integer not null,
    problemStatement    string not null,
    answer             string not null,
    -- store the user's score
    score               integer not null,
    band                integer not null,
    -- store the user's feedback
    feedback            string not null,
    userId              integer not null
);