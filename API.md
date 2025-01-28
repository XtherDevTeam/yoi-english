# API Endpoint Documentation

This document categorizes and describes the API endpoints found in the provided Python Flask application code. Each category is briefly introduced, and each endpoint includes its request method, parameters, and return values.

## 1. Service Information

This category provides information about the service itself, including its status, version, and build number.

### 1.1. `/v1/service/info`

-   **Method:** `GET`
-   **Parameters:** None
-   **Returns:**
    -   `status`: A string indicating the service status (e.g., "running").
    -   `version`: A string representing the service version.
    -   `buildNumber`: An integer representing the build number.
    -   `authenticated_session`: An integer representing the user's authenticated session ID or -1 if no session.
    -   `initialized`: A boolean indicating if the service has been initialized.

## 2. Initialization

This category contains the endpoint used to initialize the service with admin user credentials.

### 2.1. `/v1/admin/initialize`

-   **Method:** `POST`
-   **Parameters:**
    -   `username`: The username of the administrator account.
    -   `password`: The password of the administrator account.
    -   `email`: The email address of the administrator account.
    -   `google_api_key`: The Google API key.
    -  `chatbot_persona`: (Optional) The persona of the chatbot.
    -  `chatbot_name`: (Optional) The name of the chatbot.
-   **Returns:**
    -   A JSON object indicating the success or failure of the initialization, with message and data.

## 3. User Management

This category includes endpoints related to user registration, login, logout, and information retrieval.

### 3.1. `/v1/user/info` (POST) - Get current user info

-   **Method:** `POST`
-   **Parameters:** None (relies on the session)
-   **Returns:**
    -   A JSON object containing the current user's information, or an error message if not logged in.

### 3.2. `/v1/user/register`

-   **Method:** `POST`
-    **Parameters**:
         -   `username`: The username of the new user.
        -   `password`: The password of the new user.
        -   `email`: The email address of the new user.
-   **Returns:**
    -   A JSON object indicating the success or failure of the user registration with message and user ID.

### 3.3. `/v1/user/login`

-   **Method:** `POST`
-   **Parameters:**
    -   `email`: The user's email address.
    -   `password`: The user's password.
-   **Returns:**
    -   A JSON object indicating the success or failure of the login attempt, with the user ID stored in the session upon success.

### 3.4. `/v1/user/logout`

-   **Method:** `POST`
-   **Parameters:** None
-   **Returns:**
    -   A JSON object indicating successful logout.

### 3.5. `/v1/user/avatar`

-   **Method:** `GET`
-   **Parameters:** None (relies on the session)
-   **Returns:**
    -   The user's avatar image file if found, or a JSON object indicating the failure.

### 3.6. `/v1/user/<int:userId>/avatar`

-   **Method:** `GET`
-   **Parameters:**
    -  `userId`: The id of the user.
-   **Returns:**
    -   The specified user's avatar image file if found, or a JSON object indicating the failure.

### 3.7. `/v1/user/<int:userId>/info`

-   **Method:** `POST`
-   **Parameters:**
    -   `userId`: The ID of the user to retrieve info for.
-   **Returns:**
    -   A JSON object containing user info, or a failure message.

### 3.8. `/v1/user/recent_results`

-   **Method:** `GET`
-    **Parameters:** None
-   **Returns:**
    -   A JSON object containing the recent exam results of the user.

### 3.9. `/v1/user/exam_results`
-   **Method:** `GET`
-   **Parameters:** 
    -  `examType`: The type of the exam to filter.
-   **Returns:**
    -   A JSON object containing exam results based on given filters.

## 4. Admin User Management

This category is for admin-level user management, including creation, deletion, and updates.

### 4.1. `/v1/admin/users/create`

-   **Method:** `POST`
-   **Parameters:**
    -   `username`: The username of the new user.
    -   `password`: The password of the new user.
    -   `email`: The email address of the new user.
    -  `permissions`: A dictionary containing the permissions of the user.
    -  `oralExamQuota`: The quota of oral exams that user can create.
    -  `oralExamViewQuota`: The quota of oral exams that user can view.
-   **Returns:**
    -   A JSON object indicating success or failure of user creation.

### 4.2. `/v1/admin/users/delete`

-   **Method:** `POST`
-   **Parameters:**
    -   `userId`: The ID of the user to delete.
-   **Returns:**
    -   A JSON object indicating success or failure of user deletion.

### 4.3. `/v1/admin/users/update`

-   **Method:** `POST`
-   **Parameters:**
    -   `userId`: The ID of the user to update.
    -   `username`: The new username of the user.
    -   `password`: The new password of the user.
    -   `email`: The new email address of the user.
    - `permissions`: A dictionary containing the new permissions of the user.
     - `oralExamQuota`: The new quota of oral exams that user can create.
    -  `oralExamViewQuota`: The new quota of oral exams that user can view.
-   **Returns:**
    -  A JSON object indicating success or failure of user update.

### 4.4. `/v1/admin/users/list`

-   **Method:** `POST`
-   **Parameters:**
    -   `filters`: A JSON object containing filters for user retrieval.
-   **Returns:**
    -   A JSON object containing user list.

### 4.5. `/v1/user/update_password`
    -   **Method:** `POST`
    -   **Parameters:**
         -    `oldPassword`: The old password of the user
         -    `newPassword`: The new password of the user
    -   **Returns:**
         -    A JSON object indicating the success or failure of the password update.

### 4.6. `/v1/user/update_email`
    -   **Method:** `POST`
    -   **Parameters:**
         -    `newEmail`: The new email of the user.
    -   **Returns:**
        -  A JSON object indicating the success or failure of the email update.

### 4.7. `/v1/user/update_username`
    -   **Method:** `POST`
    -   **Parameters:**
        -  `newUsername`: The new username of the user.
    -  **Returns:**
        -  A JSON object indicating the success or failure of the username update.

## 5. AI Interaction

This category includes endpoints to interact with AI models.

### 5.1. `/v1/admin/ask_ai`

-   **Method:** `POST`
-   **Parameters:**
    -   `model`: The AI model to use.
    -   `temperature`: The temperature parameter for the model.
    -   `system_prompt`: The system prompt for the AI model.
    -   `user_prompt`: The user prompt for the AI model.
    -   `token`: The Google API key.
-   **Returns:**
    -   A JSON object containing the AI model's answer.

## 6. Artifact Management

This category includes endpoints for managing user-uploaded files, or artifacts.

### 6.1. `/v1/artifact/create`

-   **Method:** `POST`
-   **Parameters:**
    -   `isPrivate`: A boolean indicating whether the artifact is private.
    -   File: the file to upload.
-   **Returns:**
    -   A JSON object indicating success or failure of artifact creation, along with artifact ID.

### 6.2. `/v1/artifact/get`

-   **Method:** `GET`
-   **Parameters:**
    -   `id`: The ID of the artifact to retrieve.
-   **Returns:**
    -   The requested artifact file content, or a JSON object indicating the failure.

### 6.3. `/v1/artifact/list`

-   **Method:** `POST`
-   **Parameters:**
    -   `filters`: A JSON object containing filters for artifact retrieval.
-   **Returns:**
    -   A JSON object containing the list of artifacts.

### 6.4. `/v1/artifact/delete`

-   **Method:** `POST`
-   **Parameters:**
    -   `artifactId`: The ID of the artifact to delete.
-   **Returns:**
    -    A JSON object indicating success or failure of artifact deletion.

### 6.5. `/v1/admin/artifact/list`

-   **Method:** `POST`
-   **Parameters:**
    -   `filters`: A JSON object containing filters for artifact retrieval.
-   **Returns:**
    -  A JSON object containing the list of artifacts.

### 6.6. `/v1/admin/artifact/delete`

-   **Method:** `POST`
-   **Parameters:**
    -  `artifactId`: The ID of the artifact to delete.
-   **Returns:**
    -  A JSON object indicating success or failure of artifact deletion.

### 6.7. `/v1/admin/artifact/get`

-   **Method:** `GET`
-   **Parameters:**
    -   `id`: The ID of the artifact to retrieve.
-   **Returns:**
    -   The requested artifact file content, or a JSON object indicating the failure.

### 6.8. `/v1/admin/artifact/delete_outdated`
    -   **Method:** `POST`
    -   **Parameters:** None
    -   **Returns:**
        - A JSON object indicating success or failure of deletion of outdated artifacts.

## 7. Examination Management

This section includes endpoints for managing reading and writing examinations.

### 7.1. Admin Reading Exam Management
#### 7.1.1. `/v1/admin/examination/reading/list`
    - **Method:** `POST`
    - **Parameters:**
        -   `filters`: A JSON object containing filters for exam retrieval.
    - **Returns:**
        -   A JSON object containing the list of reading examinations.
#### 7.1.2. `/v1/admin/examination/reading/delete`
    - **Method:** `POST`
    - **Parameters:**
        - `examId`: The id of the exam to delete.
    - **Returns:**
        - A JSON object indicating success or failure of the exam deletion.
#### 7.1.3. `/v1/admin/examination/reading/create`
    - **Method:** `POST`
    - **Parameters:**
         - `passages`: An array of passage objects for the exam
        - `answerSheetFormat`: An object representing the answer sheet format.
        - `duration`: The duration of the exam in seconds
        - `title`: The title of the exam
        - `availableTime`: A list containing the start and end time of the exam.
    - **Returns:**
        -  A JSON object indicating the success or failure of the creation of the examination.
#### 7.1.4. `/v1/admin/examination/reading/update`
    - **Method:** `POST`
    - **Parameters:**
         - `examId`: The id of the exam to update.
        - `articles`: An array of passage objects for the exam
        - `answerSheetFormat`: An object representing the answer sheet format.
        - `duration`: The duration of the exam in seconds
        - `title`: The title of the exam
        - `availableTime`: A list containing the start and end time of the exam.
    - **Returns:**
        - A JSON object indicating the success or failure of the update of the examination.

#### 7.1.5. `/v1/admin/examination/reading/get`
    - **Method:** `POST`
    - **Parameters:**
         - `examId`: The id of the exam to get.
    - **Returns:**
        - A JSON object containing information about the requested exam, or failure if not found.

### 7.2. Admin Writing Exam Management
#### 7.2.1. `/v1/admin/examination/writing/list`
    - **Method:** `POST`
    - **Parameters:**
        -   `filters`: A JSON object containing filters for exam retrieval.
    - **Returns:**
        -   A JSON object containing the list of writing examinations.
#### 7.2.2. `/v1/admin/examination/writing/delete`
    - **Method:** `POST`
    - **Parameters:**
        - `examId`: The id of the exam to delete.
    - **Returns:**
        - A JSON object indicating success or failure of the exam deletion.
#### 7.2.3. `/v1/admin/examination/writing/create`
    - **Method:** `POST`
    - **Parameters:**
        - `title`: The title of the exam.
        - `availableTime`: A list containing the start and end time of the exam.
        - `duration`: The duration of the exam in seconds
        - `problemStatement`: The problem statement of the exam.
        - `onePossibleVersion`: One possible answer of the exam.
    - **Returns:**
         - A JSON object indicating the success or failure of the creation of the examination.
#### 7.2.4. `/v1/admin/examination/writing/get`
    - **Method:** `POST`
    - **Parameters:**
        - `examId`: The id of the exam to get.
    - **Returns:**
        -  A JSON object containing information about the requested exam, or failure if not found.
#### 7.2.5. `/v1/admin/examination/writing/update`
    - **Method:** `POST`
    - **Parameters:**
        - `examId`: The id of the exam to update.
        - `title`: The title of the exam.
        - `availableTime`: A list containing the start and end time of the exam.
        - `duration`: The duration of the exam in seconds
        - `problemStatement`: The problem statement of the exam.
        - `onePossibleVersion`: One possible answer of the exam.
    - **Returns:**
         - A JSON object indicating the success or failure of the update of the examination.

### 7.3. User Exam Management

#### 7.3.1. `/v1/exam/reading/list`
    -   **Method:** `POST`
    -   **Parameters:** None
    -   **Returns:**
        - A JSON object containing the list of available reading examinations.

#### 7.3.2. `/v1/exam/session/establish/reading`
    -   **Method:** `POST`
    -   **Parameters:**
         -  `examId`: The id of the exam to start.
    -   **Returns:**
         - A JSON object containing the ID of the newly created session.

#### 7.3.3. `/v1/exam/session/establish/writing`
     -   **Method:** `POST`
     -   **Parameters:**
          -  `examId`: The id of the exam to start.
     -   **Returns:**
          - A JSON object containing the ID of the newly created session.

#### 7.3.4. `/v1/exam/session/reading/get_details`
    -   **Method:** `POST`
    -   **Parameters:**
        - `sessionId`: The id of the session.
    -   **Returns:**
        - A JSON object containing details about the reading exam session.

#### 7.3.5. `/v1/exam/session/reading/update_answer`
    -   **Method:** `POST`
    -   **Parameters:**
        - `sessionId`: The id of the session.
        - `answer`: The answer for the current session.
    -   **Returns:**
        - A JSON object containing the information about the success or failure of answer updates.

#### 7.3.6. `/v1/exam/session/reading/finalize`
    -   **Method:** `POST`
    -   **Parameters:**
        - `sessionId`: The id of the session.
    -   **Returns:**
         - A JSON object containing the information of the final exam result.

#### 7.3.7. `/v1/exam/session/writing/get_details`
    -   **Method:** `POST`
    -   **Parameters:**
         - `sessionId`: The id of the session.
    -   **Returns:**
         - A JSON object containing details about the writing exam session.

#### 7.3.8. `/v1/exam/session/writing/update_answer`
    -   **Method:** `POST`
    -   **Parameters:**
        - `sessionId`: The id of the session.
        - `answer`: The answer for the current session.
    -   **Returns:**
         - A JSON object containing the information about the success or failure of answer updates.

#### 7.3.9. `/v1/exam/session/writing/finalize`
    -   **Method:** `POST`
    -   **Parameters:**
        - `sessionId`: The id of the session.
    -   **Returns:**
        -  A JSON object containing the information of the final exam result.