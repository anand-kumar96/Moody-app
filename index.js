/* === Imports === */
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.4.0/firebase-app.js";
import { getAuth,
         createUserWithEmailAndPassword,
         signInWithEmailAndPassword,
         signOut,
         onAuthStateChanged,
         GoogleAuthProvider,
         signInWithPopup,
         updateProfile     
         } from "https://www.gstatic.com/firebasejs/9.4.0/firebase-auth.js";
import { getFirestore,
         collection, 
         addDoc,
        //  doc,
        //  setDoc,
        getDocs,
        serverTimestamp,
        onSnapshot,
        query,
        where,
        orderBy,
        updateDoc,
        doc,
        deleteDoc
        } from "https://www.gstatic.com/firebasejs/9.4.0/firebase-firestore.js";

/* === Firebase Setup === */

/* IMPORTANT: Replace this with your own firebaseConfig when doing challenges */
const firebaseConfig = {
    apiKey: "AIzaSyBPznhK_4tbzPoRAZtAV_FkdNJhD9gVeas",
    authDomain: "moody-cfe75.firebaseapp.com",
    projectId: "moody-cfe75",
    storageBucket: "moody-cfe75.appspot.com",
  };

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// google authentication
const provider = new GoogleAuthProvider()

// Initialize Cloud Firestore and get a reference to the service
const db = getFirestore(app);


/* === UI === */

/* == UI - Elements == */

const viewLoggedOut = document.getElementById("logged-out-view")
const viewLoggedIn = document.getElementById("logged-in-view")

const signInWithGoogleButtonEl = document.getElementById("sign-in-with-google-btn")

const emailInputEl = document.getElementById("email-input")
const passwordInputEl = document.getElementById("password-input")

const signInButtonEl = document.getElementById("sign-in-btn")
const createAccountButtonEl = document.getElementById("create-account-btn")

const signOutButtonEl = document.getElementById("sign-out-btn")

const userProfilePictureEl = document.getElementById("user-profile-picture")

const userGreetingEl = document.getElementById("user-greeting")

const displayNameInputEl = document.getElementById("display-name-input")
const photoURLInputEl = document.getElementById("photo-url-input")
const updateProfileButtonEl = document.getElementById("update-profile-btn")

const toggleUpdateProfile = document.getElementById("update-profile-details")
const openProfileUpdate = document.getElementById("profile-img-btn")

const moodEmojiEls = document.getElementsByClassName("mood-emoji-btn")
const textareaEl = document.getElementById("post-input")
const postButtonEl = document.getElementById("post-btn")

const fetchPostsButtonEl = document.getElementById("fetch-posts-btn")

const postsEl = document.getElementById("posts")


const allFilterButtonEl = document.getElementById("all-filter-btn")

const filterButtonEls = document.getElementsByClassName("filter-btn")
/* == UI - Event Listeners == */


signInWithGoogleButtonEl.addEventListener("click", authSignInWithGoogle)

signInButtonEl.addEventListener("click", authSignInWithEmail)
createAccountButtonEl.addEventListener("click", authCreateAccountWithEmail)
signOutButtonEl.addEventListener("click", authSignOut)

for (let moodEmojiEl of moodEmojiEls) {
    moodEmojiEl.addEventListener("click", selectMood)
}

for (let filterButtonEl of filterButtonEls) {
    filterButtonEl.addEventListener("click", selectFilter)
}

updateProfileButtonEl.addEventListener("click", authUpdateProfile)

openProfileUpdate.addEventListener("click",showProfileUpdate)

postButtonEl.addEventListener("click", postButtonPressed)

fetchPostsButtonEl.addEventListener("click", fetchOnceAndRenderPostsFromDB)
/* === State === */

let moodState = 0;

/* === Global Constants === */

const collectionName = "posts"

/* === Main Code === */

//Set an authentication state observer and get user data
onAuthStateChanged(auth, (user) => {
    if (user) {
    showLoggedInView();
    // to show user profile
    showProfilePicture(userProfilePictureEl, user);
    showUserGreeting(userGreetingEl, user);
    updateFilterButtonStyle(allFilterButtonEl)
    fetchAllPosts(user)
    } else {
        showLoggedOutView();
    }
  });
/* === Functions === */

/* = Functions - Firebase - Authentication = */
function authSignInWithGoogle() {
    signInWithPopup(auth, provider)
    .then((result) => {
     console.log("Sign with google")
    }).catch((error) => {
      console.log(error.message);

    });
}

//Sign In
function authSignInWithEmail() {
    const email = emailInputEl.value;
    const password = passwordInputEl.value;
    signInWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
        clearAuthFields();
    })
    .catch((error) => {
        console.log(error.message);
    });
}

//Sign up
function authCreateAccountWithEmail() {
    const email = emailInputEl.value;
    const password = passwordInputEl.value;
    if(!email || !password){
        return ;
    }
    createUserWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
    clearAuthFields();
  })
  .catch((error) => {
    console.log(error.message);
})
}

function authSignOut() { 
    signOut(auth).then(() => {
    }).catch((error) => {
          console.log(error.message);
      });
}

// post to db
async function addPostToDB(postBody,user) {
    /*
    //To create or overwrite a single document, use the following language-specific set() methods:
    try {
        // here post01 is document id can be anything
        await setDoc(doc(db, "posts", "post01"), {
            body:postBody
          });
      } catch (e) {
        console.log(e.message);
      }
*/
    try {
        const docRef = await addDoc(collection(db, collectionName), {
         body:postBody,
         uid:user.uid,
         mood:moodState,
         createdAt:serverTimestamp()
        });
        console.log("Document written with ID: ", docRef.id);
      } catch (e) {
        console.log(e.message);
      }

}
// update post to db
async function updatePostInDB(docId,newBody){
try{
    const postRef = doc(db, collectionName, docId);
    await updateDoc(postRef, {
      body:newBody
    });
}catch(e){
console.log(e.message);
}
}

// delete post from db
async function deletePostFromDB(docId){
    try{
        await deleteDoc(doc(db, collectionName, docId));
    }catch(e){
        console.log(e.message)
    }
}

//Method 01 Get data once by clicking on fetch button
async function fetchOnceAndRenderPostsFromDB() {
    const querySnapshot = await getDocs(collection(db, collectionName));
// clearing post before fetching
    clearAll(postsEl)
querySnapshot.forEach((doc) => {
    renderPost(postsEl,doc)
});
}

/* == Functions - UI Functions == */

function createPostUpdateButton(wholeDoc) {
    const postId = wholeDoc.id;
    const postData = wholeDoc.data()
    /* 
        <button class="edit-color">Edit</button>
    */
    const button = document.createElement("button")
    button.textContent = "Edit"
    button.classList.add("edit-color")
    button.addEventListener("click", function() {
       const newBody = prompt("Edit the post",postData.body);
       if(newBody){
        updatePostInDB(postId,newBody)
       }
    })
    
    return button
}

function createPostDeleteButton(wholeDoc) {
    const postId = wholeDoc.id
    
    /* 
        <button class="delete-color">Delete</button>
    */
    const button = document.createElement('button')
    button.textContent = 'Delete'
    button.classList.add("delete-color")
    button.addEventListener('click', function() {
        deletePostFromDB(postId)
    })
    return button
}

function createPostFooter(wholeDoc) {
    /* 
        <div class="footer">
            <button>Edit</button>
        </div>
    */
    const footerDiv = document.createElement("div")
    footerDiv.className = "footer"
    
    footerDiv.appendChild(createPostUpdateButton(wholeDoc))
    footerDiv.appendChild(createPostDeleteButton(wholeDoc))
    return footerDiv
}

function renderPost(postsEl, wholeDoc) {
    const postData = wholeDoc.data()
    const postDiv = document.createElement('div');
    postDiv.className = "post";

    const headerDiv = document.createElement("div");
    headerDiv.className="header";

    const h3Tag = document.createElement("h3");
    h3Tag.textContent = displayDate(postData.createdAt);

    const imgTag = document.createElement("img");
    imgTag.src = `assets/emojis/${postData.mood}.png`;

    const pTag = document.createElement("p");
    pTag.textContent = replaceNewlinesWithBrTags(postData.body);

    headerDiv.appendChild(h3Tag);
    headerDiv.appendChild(imgTag);
    postDiv.appendChild(headerDiv);
    postDiv.appendChild(pTag)
    postDiv.appendChild(createPostFooter(wholeDoc))
    postsEl.appendChild(postDiv)   
}

function replaceNewlinesWithBrTags(inputString) {
   return inputString.replace(/\n/g,"<br>")
}



// method 2 fetching data in real time
function fetchInRealtimeAndRenderPostsFromDB(query) {
    onSnapshot(query,(querySnapshot)=>{
        clearAll(postsEl);
        querySnapshot.forEach((doc)=>{
            renderPost(postsEl,doc)
        })
    });
}


function fetchTodayPosts(user){
    const startOfDay = new Date();
    startOfDay.setHours(0,0,0,0);
    const endOfDay = new Date();
    endOfDay.setHours(23,59,59,999);
    const postRef = collection(db, collectionName)
    const q = query(postRef,where("uid","==",user.uid),
                            where("createdAt",">=",startOfDay),
                            where("createdAt","<=",endOfDay),
                            orderBy("createdAt","desc"));

    fetchInRealtimeAndRenderPostsFromDB(q);                       
}

function fetchWeeklyPosts(user){
    const startOfWeek = new Date();
    startOfWeek.setHours(0,0,0,0);
    if(startOfWeek.getDay()==0){ // Sunday
      startOfWeek.setDate(startOfWeek.getDate()-6); // means previous monday
    }else{
        startOfWeek.setDate(startOfWeek.getDate()-startOfWeek.getDay()+1);
    }
    const endOfDay = new Date();
    endOfDay.setHours(23,59,59,999);
    const postRef = collection(db, collectionName)
    const q = query(postRef,where("uid","==",user.uid),
                            where("createdAt",">=",startOfWeek),
                            where("createdAt","<=",endOfDay),
                            orderBy("createdAt","desc"));

    fetchInRealtimeAndRenderPostsFromDB(q); 
}

function fetchMonthlyPosts(user){
    const startOfMonth = new Date();
    startOfMonth.setHours(0,0,0,0);
    startOfMonth.setDate(1);
    const endOfDay = new Date();
    endOfDay.setHours(23,59,59,999);
    const postRef = collection(db, collectionName)
    const q = query(postRef,where("uid","==",user.uid),
                            where("createdAt",">=",startOfMonth),
                            where("createdAt","<=",endOfDay),
                            orderBy("createdAt","desc"));

    fetchInRealtimeAndRenderPostsFromDB(q); 
    
}
function fetchAllPosts(user){
    const postRef = collection(db, collectionName)
    const q = query(postRef,where("uid","==",user.uid),orderBy("createdAt","desc"));
    fetchInRealtimeAndRenderPostsFromDB(q); 
    
}

function postButtonPressed() {
    const postBody = textareaEl.value
    const user = auth.currentUser
    if (postBody && moodState!==0) {
        addPostToDB(postBody,user)
        clearInputField(textareaEl)
        resetAllMoodElements(moodEmojiEls);
        resetAllFilterButtons(filterButtonEls)
        updateFilterButtonStyle(allFilterButtonEl)
    }
}

function clearAll(element){
    element.innerHTML ="";
}

function showLoggedOutView() {
    hideView(viewLoggedIn) 
    showView(viewLoggedOut)
}

function showLoggedInView() {
    hideView(viewLoggedOut)
    showView(viewLoggedIn)
}

function showView(view) {
    view.style.display = "flex"
}

function hideView(view) {
    view.style.display = "none"
}

function clearInputField(field){
    field.value ="";
}
function clearAuthFields(){
    clearInputField(emailInputEl);
    clearInputField(passwordInputEl);
}

function showProfilePicture(imgElement, user) {
   if(user.photoURL){
    imgElement.src=user.photoURL;
   }else{
    imgElement.src="assets/images/default-profile-picture.jpeg";
   }
}

function showUserGreeting(element, user) {
    const displayName = user.displayName;
    if(displayName){
        const firstName = displayName.split(" ")[0];
        element.textContent = `Hey ${firstName}, how are you?`
    }else{
        element.textContent = `Hey friend, how are you?`
    }
    
}
function showProfileUpdate(){
    if(toggleUpdateProfile.style.display === "" || toggleUpdateProfile.style.display==="none"){
        toggleUpdateProfile.style.display ="block"
    }else{
        toggleUpdateProfile.style.display= "none"
    }
}
// to update profile
function authUpdateProfile() {
    let newDisplayName = displayNameInputEl.value;
    let newPhotoURL = photoURLInputEl.value;
    if(!newDisplayName){
        newDisplayName = auth.currentUser.displayName
    }
     if(!newPhotoURL){
        newPhotoURL = auth.currentUser.photoURL;
     }
     
    updateProfile(auth.currentUser, {
        displayName:newDisplayName, photoURL: newPhotoURL
      }).then(() => {
        console.log("Profile picture updated");
        showProfileUpdate()
        location.reload() 
      }).catch((error) => {
       console.log(error.message);
      });
      //Justin Bieber profile picture URL: https://i.imgur.com/6GYlSed.jpg
}

//Very Important to display date
function displayDate(firebaseDate) {
    if(!firebaseDate){ // in realtime so fast so may so null
        return "Date proccessing"
    }
    const date = firebaseDate.toDate()
    
    const day = date.getDate()
    const year = date.getFullYear()
    
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    const month = monthNames[date.getMonth()]

    let hours = date.getHours()
    let minutes = date.getMinutes()
    hours = hours < 10 ? "0" + hours : hours
    minutes = minutes < 10 ? "0" + minutes : minutes

    return `${day} ${month} ${year} - ${hours}:${minutes}`
}

/* = Functions - UI Functions - Mood = */

function selectMood(event) {
    const selectedMoodEmojiElementId = event.currentTarget.id
    
    changeMoodsStyleAfterSelection(selectedMoodEmojiElementId, moodEmojiEls)
    
    const chosenMoodValue = returnMoodValueFromElementId(selectedMoodEmojiElementId)
    
    moodState = chosenMoodValue
}

function changeMoodsStyleAfterSelection(selectedMoodElementId, allMoodElements) {
    for (let moodEmojiEl of moodEmojiEls) {
        if (selectedMoodElementId === moodEmojiEl.id) {
            moodEmojiEl.classList.remove("unselected-emoji")          
            moodEmojiEl.classList.add("selected-emoji")
        } else {
            moodEmojiEl.classList.remove("selected-emoji")
            moodEmojiEl.classList.add("unselected-emoji")
        }
    }
}

function resetAllMoodElements(allMoodElements) {
    for (let moodEmojiEl of allMoodElements) {
        moodEmojiEl.classList.remove("selected-emoji")
        moodEmojiEl.classList.remove("unselected-emoji")
    }
    
    moodState = 0
}

function returnMoodValueFromElementId(elementId) {
    return Number(elementId.slice(5))
}



/* == Functions - UI Functions - Date Filters == */

function resetAllFilterButtons(allFilterButtons) {
    for (let filterButtonEl of allFilterButtons) {
        filterButtonEl.classList.remove("selected-filter")
    }
}

function updateFilterButtonStyle(element) {
    element.classList.add("selected-filter")
}

function selectFilter(event) {
    console.log(event.target.id)
    const user = auth.currentUser
    
    const selectedFilterElementId = event.target.id
    
    const selectedFilterPeriod = selectedFilterElementId.split("-")[0]
    
    const selectedFilterElement = document.getElementById(selectedFilterElementId)
    
    resetAllFilterButtons(filterButtonEls)
    updateFilterButtonStyle(selectedFilterElement)
    if(selectedFilterPeriod=="today"){
        fetchTodayPosts(user);
    }else if(selectedFilterPeriod=="week"){
        fetchWeeklyPosts(user);
    }else if(selectedFilterPeriod=="month"){
        fetchMonthlyPosts(user);
    }else if(selectedFilterPeriod=="all"){
        fetchAllPosts(user);
    }
}
/*
Fetch data => 1) fetching once
              2) fetching data in real time
*/