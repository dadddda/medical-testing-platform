// constants
const CHATS_REF = firebase.firestore().collection("chats");
const CLINICS_REF = firebase.firestore().collection("clinics");

// ---------------------------------------------------------------------- CHATS

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
export async function fetchMessageDocs(userId, clinicId) {
    let chatDoc = await fetchChatDoc(userId, clinicId);

    if (chatDoc == undefined) {
        await createChatDoc(userId, clinicId);
        chatDoc = await fetchChatDoc(userId, clinicId);
    }

    let messagesRef = firebase.firestore().collection("chats/" + chatDoc.id + "/messages");
    let messages = await messagesRef
        .orderBy("date")
        .get();

    return {
        chatDoc: chatDoc,
        messageDocs: messages.docs
    };
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
async function createChatDoc(userId, clinicId) {
    await CHATS_REF.add({
        userId: userId,
        clinicId: clinicId,
        userSeen: null,
        clinicSeen: null,
        latestMessageDate: null
    });
}

/**
 * Stores given message to given chatDoc's messages collection in Firestore database
 * and updates appropriate fields.
 * @param {String} sender
 * @param {String} message 
 * @param chatDoc
 */
export async function sendMessage(sender, message, chatDoc) {
    if (sender != "user" && sender != "clinic") return;

    let key = (sender == "user") ? "clinicSeen" : "userSeen";
    await CHATS_REF.doc(chatDoc.id).update({
        latestMessageDate: firebase.firestore.FieldValue.serverTimestamp(),
        [key]: false
    });

    let messagesRef = firebase.firestore().collection("chats/" + chatDoc.id + "/messages");
    let latestMessageRef = await messagesRef.add({
        date: firebase.firestore.FieldValue.serverTimestamp(),
        sender: sender,
        text: message
    });

    await CHATS_REF.doc(chatDoc.id).update({
        latestMessageId: latestMessageRef.id
    });
}

/**
 * Marks given readers 'seen' status in given chat document
 * in Firestore database.
 * @param {String} reader 
 * @param chatDoc 
 */
export async function markAsRead(reader, chatDoc) {
    if (reader != "user" && reader != "clinic") return;

    await CHATS_REF.doc(chatDoc.id).update({
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
