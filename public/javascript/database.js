// constants
const CHATS_REF = firebase.firestore().collection("chats");
const CLINICS_REF = firebase.firestore().collection("clinics");
const SUPPORTED_TESTS_REF = firebase.firestore().collection("supportedTests");

// ---------------------------------------------------------------------- MESSAGES

/**
 * Returns documents from Firestore chats collection with given
 * sender and sender's ID after given document. If limit is not 
 * specified every document is returned. Returned documents are 
 * ordered by descending date.
 * @param {String} sender 
 * @param {String} senderId 
 * @param after 
 * @param {Number} limit 
 */
export async function fetchChatDocsAfter(sender, senderId, after, limit = 0) {
    if (sender != "user" && sender != "clinic") return;

    let chatsRef = await CHATS_REF
        .where(sender + "Id", "==", senderId)
        .orderBy("latestMessageDate", "desc")
        .startAfter(after);
    if (limit > 0) chatsRef = await chatsRef.limit(limit);
    let chats = await chatsRef.get();
    
    return chats.docs;
}

/**
 * Returns documents from Firestore chats collection with given
 * sender and sender's ID. If limit is not specified every document
 * is returned. Returned documents are ordered by descending date.
 * @param {String} sender 
 * @param {String} senderId 
 * @param {Number} limit 
 */
export async function fetchChatDocs(sender, senderId, limit = 0) {
    if (sender != "user" && sender != "clinic") return;

    let chatsRef = await CHATS_REF
        .where(sender + "Id", "==", senderId)
        .orderBy("latestMessageDate", "desc");
    if (limit > 0) chatsRef = await chatsRef.limit(limit);
    let chats = await chatsRef.get();
    
    return chats.docs;
}

/**
 * Executes given function every time a chat document, with given parameters, 
 * is modified. Returns reference to later detach listener to database changes.
 * @param {String} sender 
 * @param {String} senderId 
 * @param {Function} functionRef 
 */
export function executeOnChatDocsChanges(sender, senderId, functionRef) {
    if (sender != "user" && sender != "clinic") return;

    let unsubscribe = CHATS_REF
        .where(sender + "Id", "==", senderId)
        .orderBy("latestMessageDate", "desc")
        .onSnapshot({includeMetadataChanges: true}, (snapshot) => {
            snapshot.docChanges({includeMetadataChanges: true}).forEach((change) => {
                let changeType = change.type;
                let changeSource = change.doc.metadata.hasPendingWrites ? "local" : "server";

                if (changeType == "added" && changeSource == "server"
                    || changeType == "modified" && changeSource == "server") {
                    functionRef(change.doc, changeType);
                }
            });
        });

    return unsubscribe;
}

/**
 * Returns one document from Firestore chats collection with given
 * user and clinic IDs.
 * @param {String} userId 
 * @param {String} clinicId 
 */
export async function fetchChatDoc(userId, clinicId) {
    let chats = await CHATS_REF
        .where("userId", "==", userId)
        .where("clinicId", "==", clinicId)
        .get();
    
    return chats.docs[0];
}

/**
 * Fetches appropriate message documents using given user id and clinic id. 
 * If current combination of user and clinic doesn't exsist in database, 
 * new document is created.
 * @param {String} userId
 * @param {String} clinicId
 */
export async function createAndFetchMessageDocs(userId, clinicId) {
    let chatDoc = await fetchChatDoc(userId, clinicId);

    if (chatDoc == undefined) {
        await createChatDoc(userId, clinicId);
        chatDoc = await fetchChatDoc(userId, clinicId);
    }

    let messagesRef = firebase.firestore().collection("chats/" + chatDoc.id + "/messages");
    let messages = await messagesRef
        .orderBy("date", "desc")
        .get();

    return {
        chatDoc: chatDoc,
        messageDocs: messages.docs
    };
}

/**
 * Returns documents from path built from given chat document ID.
 * @param {String} chatDocId 
 */
export async function fetchMessageDocs(chatDocId) {
    let messagesRef = firebase.firestore().collection("chats/" + chatDocId + "/messages");
    let messages = await messagesRef
        .orderBy("date", "desc")
        .get();

    return messages.docs;
}

/**
 * Executes given function every time a new document is added to messages collection 
 * of a chats document with given 'chatDocId'. Given function is also executed when this
 * function is called for the first time to add content to HTML. Returns reference to later detach
 * listener to database changes.
 * @param {String} chatDocId 
 * @param {Function} functionRef
 */
export function executeOnMessageDocsChanges(chatDocId, functionRef) {
    let unsubscribe = firebase.firestore().collection("chats/" + chatDocId + "/messages");
    unsubscribe = unsubscribe
        .orderBy("date", "desc")
        .onSnapshot({includeMetadataChanges: true}, (snapshot) => {
            snapshot.docChanges({includeMetadataChanges: true}).forEach((change) => {
                let changeType = change.type;
                let changeSource = change.doc.metadata.hasPendingWrites ? "local" : "server";

                if (changeType == "added" && changeSource == "server"
                    || changeType == "modified" && changeSource == "server") {
                    functionRef(change.doc, changeType);
                }
            });
        });

    return unsubscribe;
}

/**
 * Returns document from path built from given chat document ID and message document ID.
 * @param {String} chatDocId 
 * @param {String} messageDocId 
 */
export async function fetchMessageDoc(chatDocId, messageDocId) {
    let messagesRef = firebase.firestore().collection("chats/" + chatDocId + "/messages");
    let messageDoc = await messagesRef.doc(messageDocId).get();

    return messageDoc;
}

/**
 * Creates new chat document of current user and clinic combination
 * in Firestore database.
 * @param {String} userId
 * @param {String} clinicId
 */
export async function createChatDoc(userId, clinicId) {
    await CHATS_REF.add({
        userId: userId,
        clinicId: clinicId,
        userSeen: null,
        clinicSeen: null,
        latestMessageDate: null
    });
}

/**
 * Stores given message to chatDoc's messages collection with given ID 
 * in Firestore database and updates appropriate fields.
 * @param {String} sender
 * @param {String} message 
 * @param chatDoc
 */
export async function sendMessage(sender, message, chatDocId) {
    if (sender != "user" && sender != "clinic") return;

    let messagesRef = firebase.firestore().collection("chats/" + chatDocId + "/messages");
    let latestMessageRef = await messagesRef.add({
        date: firebase.firestore.FieldValue.serverTimestamp(),
        sender: sender,
        text: message
    });

    let key = (sender == "user") ? "clinicSeen" : "userSeen";
    await CHATS_REF.doc(chatDocId).update({
        latestMessageId: latestMessageRef.id,
        latestMessageDate: firebase.firestore.FieldValue.serverTimestamp(),
        [key]: false
    });
}

/**
 * Marks given readers 'seen' status in chat document with
 * given ID in Firestore database.
 * @param {String} reader 
 * @param chatDoc 
 */
export async function markAsRead(reader, chatDocId) {
    if (reader != "user" && reader != "clinic") return;

    await CHATS_REF.doc(chatDocId).update({
        [reader + "Seen"] : true
    });
}

// ---------------------------------------------------------------------- CLINICS

/**
 * Returns document from clinics collection with given ID.
 * @param {String} clinicId 
 */
export async function fetchClinicDoc(clinicId) {
    let clinicDoc = await CLINICS_REF.doc(clinicId).get();
    
    return clinicDoc;
}

// ---------------------------------------------------------------------- SUPPORTED TESTS

/**
 * Returns documents from Firestore supported tests collection.
 * If limit is not specified every document is returned.
 * @param {Number} limit 
 */
export async function fetchSupportedTestDocs(limit = 0) {
    let supportedTestsRef = SUPPORTED_TESTS_REF;
    if (limit > 0) supportedTestsRef = await supportedTestsRef.limit(limit);
    let supportedTests = await supportedTestsRef.get();
    
    return supportedTests.docs;
}
