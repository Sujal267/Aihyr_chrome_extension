import { useState, useEffect } from 'react'
import viteLogo from '/1.svg'
import linkedInLogo from '/icons8-linkedin-96.png'
import naukriLogo from '/naukri.png'
import nxtwaveLogo from '/nsxtwave.jpg'
import iimJobsLogo from '/iimjobs.png'
import indeedLogo from '/Indeed_Logo_RGB.png'
import hiristLogo from '/hirist.png'


import './App.css'

function App() {
  const selectStyle = { backgroundColor: 'rgb(235, 242, 250)', color: 'black', padding: '10px', borderRadius: '5px', border: "1px solid black", fontSize: '16px', cursor: 'pointer', width: "150px" };
  const [logedIn, setLogedIn] = useState(0)
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("")
  const [jobdata, setJobdata] = useState([]);
  const [job_id, setJob_id] = useState();
  const [company_id, setComapny_id] = useState()
  const [userName, setUsername] = useState('')
  const [statetoken, setStateToken] = useState("")

  useEffect(() => {

  }, [company_id, job_id, userName, statetoken]);

  async function fetchPost(newtoken) {
    setStateToken(newtoken)

    // fetch all the job postings from aihyr backend
    fetch('https://providentiainterviewbackend.azurewebsites.net/labs/jobpostings', {
      headers: {
        'Authorization': `Bearer ${newtoken}`
      }
    })
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(data => {
        //store the data in a variable

        console.log(data[0].job)
        setComapny_id(String(data[0].job.company_id))
        setJob_id(String(data[0].job._id))
        setJobdata(data);
      })
      .catch(error => {
        console.error('There was a problem with the fetch operation:', error);
      });
  }

  // below function create a button on the portal for uploading resume

  async function createButton() {
    console.log("called")
    console.log(company_id)
    let [tab] = await chrome.tabs.query({ active: true });
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: async (companyid, jobid,token) => {
        let tabUrl = window.location.href;
        // URL of current job portal
        tabUrl = String(tabUrl);
        var element = null
        if (tabUrl.includes("hirist") || tabUrl.includes("iimjobs")) {
          // get the path of specific div where we need to add that button using Xpath
          element = document.evaluate(
            '/html/body/div[22]/div[2]/div[1]/div/div[1]/div[1]/div[2]/div[3]',
            document,
            null,
            XPathResult.FIRST_ORDERED_NODE_TYPE,
            null
          ).singleNodeValue;
        }
        if (!element) {
          // if the provided Xpath is wrong
          alert("error in finding element")
        }
        else {
          var uploadButton = document.createElement("button");
          uploadButton.innerHTML = "Upload Resume";
          uploadButton.style.padding = "10px 20px";
          uploadButton.style.backgroundColor = "#4CAF50";
          uploadButton.style.color = "white";
          uploadButton.style.border = "none";
          uploadButton.style.borderRadius = "5px";
          uploadButton.style.cursor = "pointer";
          // below function handle the request of uplaoding resume to aihyr backend
          uploadButton.addEventListener("click", async function () {
            // get the id where the download resume option is located on portal
            let resume = document.getElementsByClassName("download candidateDownloadResume");
            // Url for downloading the resume
            let resumeUrl = resume[0].dataset.href;
            console.log(resumeUrl);
            const pdfUrl = String(resumeUrl);

            try {
              // this for showing the status of request
              let paraStatus = document.createElement("p");
              paraStatus.textContent = "Uploading resume...."
              paraStatus.style.margin = "5px";
              paraStatus.style.color = "green";
              paraStatus.style.backgroundColor = "white";
              paraStatus.style.padding = "5px";
              paraStatus.style.border = "2px solid green";
              paraStatus.style.borderRadius = "7px";
              element.appendChild(paraStatus);
              // downloads the pdf from that url
              const pdfResponse = await fetch(pdfUrl);
              const pdfBlob = await pdfResponse.blob();
              // As of now source is hardcoded

              //<-------- Todo---------> - get the sorce of resume from url, make it dynnamic
              const source = "iimJobs";
              let fileName = pdfUrl.match(/\/resume\/([^\/]+)\//)[1];
              // this convert file to .pdf format
              const pdfFile = new File([pdfBlob], `${fileName}.pdf`, { type: 'application/pdf' });
              let newcompanyid = companyid
              let newjobid = jobid
              const formData = new FormData();

              formData.append(fileName, pdfFile);
              // post request for uploading resume
              const response = await fetch(`https://providentiainterviewbackend.azurewebsites.net/labs/evaluate/resumes/${newcompanyid}/${newjobid}/${source}`, {
                method: 'POST',
                body: formData,
                // <-------- Todo---------> see here i have hardcoded the token, try to make it dynnamic like there is variable named token, see how can you use it here.
                headers: {
                  'Authorization': `Bearer ${token}`,
                },
              });
              const responseData = await response.json();
              if (responseData.status == 401) {
                element.removeChild(paraStatus);
                alert("Error in uplading resume")
                throw new Error(`HTTP error! Status: ${response.status}`);
              }
              if (response.status == 200 || response.status == 201 || response.status == 202) {
                element.removeChild(paraStatus);
                paraStatus.textContent = "Uploaded Successfully!"
                element.appendChild(paraStatus);
                setTimeout(function () {
                  element.removeChild(paraStatus);
                }, 1500);
                console.log('Upload successful', responseData);
              }
            } catch (error) {
              console.error('Error uploading PDF:');
              element.removeChild(paraStatus);
              alert("Error in uplading resume... Try once again")
            }
          });
          element.appendChild(uploadButton);
        }
      },
      args: [company_id, job_id,statetoken]
    })
  }

  async function loginClick() {
    {
      if (!email) {
        alert("enter email")
      }
      if (!password) {
        alert("enter password")
      }
      if (email && password) {
        try {
          const response = await fetch(`https://providentiainterviewbackend.azurewebsites.net/labs/login`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
          });
          const data = await response.json()
          let token = data.token
          setUsername(data.name)
          setLogedIn(2)
          await fetchPost(token)
          if (!response.ok) {
            alert("invalid credentials")
          }
        } catch (e) {
          console.log("error", e)
        }
      }
    }

  }

  return (
    <>
      {!logedIn ? (
        <>
          <div>
            <div>
              <h1 style={{ color: "#224C84" }}>
                Welcome to <div style={{ marginBottom: '-60px', marginTop: "-30px" }}>
                  <a href="https://aihyr.com/" target="_blank">
                    <img src={viteLogo} width="150px" alt="AiHyr" />
                  </a>
                </div>
              </h1>
            </div>
            <div>
              <div>
                <a href="https://www.linkedin.com/" target="_blank">
                  <img style={{ margin: "5px", backgroundColor: "white" }} src={linkedInLogo}></img>
                </a>
                <a href="https://www.naukri.com/" target="_blank">
                  <img style={{ margin: "5px", backgroundColor: "white" }} src={naukriLogo}></img>
                </a>
                <a href="https://in.indeed.com/" target="_blank">
                  <img style={{ margin: "5px", backgroundColor: "white" }} src={indeedLogo}></img>
                </a>
              </div>
              <div>
                <a href="https://www.iimjobs.com/" target="_blank">
                  <img style={{ margin: "5px", backgroundColor: "white" }} src={iimJobsLogo}></img>
                </a>
                <a href="https://www.hirist.tech/" target="_blank">
                  <img style={{ margin: "5px", backgroundColor: "white" }} src={hiristLogo}></img>
                </a>
                <a href="https://www.ccbp.in/" target="_blank">
                  <img style={{ margin: "5px", backgroundColor: "white" }} src={nxtwaveLogo}></img>
                </a>
              </div>
            </div>
            <h2 style={{ color: "#224C84" }}>Sign into AiHYR Account</h2>
            <div>
              <div>
                <h3 style={{ color: "#224C84", marginBottom: "-7px", textAlign: "left", marginLeft: "17px" }}>Username</h3>
              </div>
              <input style={{ color: "#224C84" }} className='input-field' value={email} onChange={(e) => { setEmail(e.target.value); }} placeholder='Enter Email'></input>
            </div>
            <div>
              <div>
                <h3 style={{ color: "#224C84", marginBottom: "-7px", textAlign: "left", marginLeft: "17px" }}>Password</h3>
              </div>
              <input style={{ color: "#224C84" }} className='input-field' type='password' value={password} onChange={(e) => { setPassword(e.target.value); }} placeholder='Enter Password'></input>
            </div>
            <div style={{ margin: "10px", padding: "5px" }}>
              <button onClick={loginClick} style={{ fontSize: "15px" }}>Login</button>
            </div>
          </div>
        </>
      ) : (
        <>
          <div >
            <div style={{ margin: "10px", color: "#224C84" }}>
              <h2>Hello {userName}</h2>
              <h3>Select a job posting to upload Resume</h3>
            </div>
            {/* Different job postings are listed below
                <--------- Todo ----------> there should be an input where user types the company name, 
                it should display all the job postings specific to that company.
             */}
            <select style={selectStyle} onChange={(e) => {
              const arrayindex = e.target.value;
              setComapny_id(String(jobdata[arrayindex].job.company_id))
              setJob_id(String(jobdata[arrayindex].job._id))
            }}>
              {jobdata.map((value, index) => (
                <option key={index} value={index}>
                  {value.job.job_role}
                </option>
              ))}
            </select>
            <div className="card">
              <button onClick={createButton} style={{ fontSize: "15px" }}>Done</button>
            </div>
          </div>
        </>
      )}
    </>
  )

}

export default App

// See there is lot of code repetition, try minimize it and try optimize the code a little bit if possible

