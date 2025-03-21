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
    avatarMime              string not null default 'image/png',
    overallPerformance      string not null default '',
    overallBand             string not null default 'A',
    overallAssessmentTrigger integer not null default 0
);

create table config (
    chatbotName         string not null,
    chatbotPersona      string not null,
    chatbotAvatar       blob not null,
    chatbotAvatarMime   string not null default 'image/png',
    enableRegister      integer not null default 1,
    googleApiKey        string not null,
    AIDubEndpoint       string not null,
    AIDubModel          string not null
);


create table oralEnglishExamPaper (
    id                  integer primary key autoincrement,
    createTime          integer not null,
    userId              integer not null,
    title               string not null,
    warmUpTopics        string not null default '[]',
    mainTopic           string not null,
    availableTime       integer not null,
    expireTime          integer not null
);

create table oralEnglishExamResult (
    id                        integer primary key autoincrement,
    completeTime              integer not null,
    examPaperId               integer not null,
    band                      integer not null,
    overallFeedback           string not null,
    contentFeedback           string not null,
    pronounciationFeedback    string not null,
    answerDetails             string not null default '[]',
    userId                    integer not null
);

create table artifact (
    id            integer primary key autoincrement,
    content       blob not null,
    mimetype      string not null,
    createTime    integer not null,
    expireTime    integer not null,
    userId        integer not null,
    isPrivate     integer not null default 0
);

create table academicalPassageExamPaper (
    id                  integer primary key autoincrement,
    createTime          integer not null,
    userId              integer not null,
    -- store markdown content of the paper
    title               string not null,
    passages            string not null,
    -- json string of the answer sheet format
    answerSheetFormat   string not null,
    answers             string not null,
    duration            integer not null,
    expireTime          integer not null,
    availableTime       integer not null
);

create table academicalPassageExamResult (
    id                  integer primary key autoincrement,
    -- store the id of the exam paper
    completeTime        integer not null,
    examSessionId       string not null,
    examPaperId         integer not null,
    answerSheet         string not null default '[]',
    -- store the user's score
    correctAnsCount     integer not null,
    band                integer not null,
    -- store the user's feedback
    feedback            string not null,
    userId              integer not null
);


create table essayWritingExamPaper (
    id                  integer primary key autoincrement,
    createTime          integer not null,
    userId              integer not null,
    -- store markdown content of the paper
    title               string not null,
    problemStatement    string not null,
    onePossibleVersion  string not null,
    duration            integer not null,
    expireTime          integer not null,
    availableTime       integer not null
);


create table essayWritingExamResult (
    id                  integer primary key autoincrement,
    -- store the id of the exam paper
    examPaperId         integer not null,
    completeTime        integer not null,
    answer              string not null default '',
    -- store the user's score
    band                integer not null,
    -- store the user's feedback
    feedback            string not null,
    userId              integer not null
);

create table favouriteWord (
    id                  integer primary key autoincrement,
    word                string not null,
    example_sentence    string not null default '[]'
);

create table userWordList (
    id                  integer primary key autoincrement,
    userId              integer not null,
    wordlist            string not null default '[]'
);