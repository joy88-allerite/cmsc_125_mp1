import React, {useState} from 'react';
import Table from './Table';
import './App.css';

function App() {

  //Set Background-color
  document.body.style = 'background: #000000;';
  document.title = 'ALLERITE, MARY JOY A. | MP1';

  //States
  const [start, setStart] = useState(false);
  const [pending, setPending] = useState([]);
  const [newPending, setNewPending] = useState([]);
  const [ongoing, setOngoing] = useState([]);
  const [counters, setCounters] = useState([]);
  const [totalDuration, setTotalDuration] = useState([]);

  const [resources, setResources] = useState([]);

  //Generate a random number min - max
  function generateRand(min, max) {
    const rand = min + Math.random() * (max - min);
    
    return Math.floor(rand)
  }

  //Generate a randum number of resources or users 
  function generateResourcesUsers() {
    const quantity = generateRand(1,30);
    var resourceData = [];

    for(var i = 0; i < quantity - 1; i++) {
      var resource = generateRand(1,30);

      //No duplicate resources or users
      if(resourceData.includes(resource) === false) {
          resourceData.push(resource);
      } else {
        i--;
      }
    }

    return resourceData;
  }

  //Assign resources to users
  function assignResourcesToUsers(resourceLabels, userLabels) {
    var list = [];
    userLabels.map((user) => {
      const quantity = generateRand(1,30);
      var tempResource = resourceLabels.slice();
      
      for(var i = 0; i < quantity - 1; i++) {

        //if all resourceLabels are used by a user
        if(tempResource.length === 0) {
            break; //exit out loop
        }
        var randomDuration = generateRand(1,30);
        const randomIndex = Math.floor(Math.random() * tempResource.length);
        var randomResource = tempResource[randomIndex];

        var info = {};
        info.user = user;
        info.resource = randomResource;
        info.duration = randomDuration;
        info.status = "pending";

        list.push(info);
        tempResource.splice(randomIndex, 1);
      }
    
    });

    return list;
    
  }

  function setPriority(list) {
    const sortByResource = list.sort((a, b) => (a.resource < b.resource) ? 1 : -1);
    const priorityList = sortByResource.sort((a, b) => (
      a.resource == b.resource && a.user > b.user) ? 1 : -1);

    return priorityList;
    
  }

  function setInitialOngoing(pending, resourceLabels) {
    var initial = [];
    var currentPending = pending.slice(0);
    var newPending = [];

        //Set total duration
        var r = {};
        pending.forEach(function(o) {
          r[o.resource] = (r[o.resource] || 0 ) + o.duration;
        })

        var result = Object.keys(r).map(function(k) {
          return {resource: k, duration: r[k], secondsOnHold: 0 ,stat: 'ongoing' }
        });

        setTotalDuration(result)

       currentPending.map((data, index) => {
        if(index === 0) {
          currentPending[index]['status'] = 'ongoing';
          initial.push(data);
        } 
        else {
          
          const found = initial.some(el => el.resource === data.resource || el.user === data.user);

          if (!found){ 
            currentPending[index]['status'] = 'ongoing';
            initial.push(data);
          } else {
             newPending.push(currentPending[index]);
          }
        }
    });    
    // add space for uncalled resources due to conflict priority
    if(initial != null && resourceLabels != null) {
       if(initial.length != resourceLabels.length) {
        resourceLabels.map((data) => {
          const found = initial.some(el => el.resource === data);
  
          if(!found) {
            var info = {};
            info.user = "";
            info.resource = data;
            info.duration = "";
            info.status = "waiting";
            initial.push(info);
          }
        });
      }
    }

    setStart(true);
    return {
      ongoing: initial.sort((a, b) => (a.resource > b.resource) ? 1 : -1),
      pending: newPending
    };
  }
 
  function setUse() {
    var list = [...ongoing];
    var duration = [...totalDuration];
    var currentPending = [...pending];
    for(var i = 0; i <= list.length - 1; i++) {
        if(list[i]['duration'] !== 0 && list[i]['status'] != 'done' && list[i]['status'] != 'pending users still busy' && list[i]['status'] != 'waiting') {
          //decrement duration per 1 second
          list[i]['duration'] = list[i]['duration'] - 1;
          if(duration[i]['duration'] !== 0) {
            duration[i]['stat'] = 'ongoing';
            duration[i]['duration'] = duration[i]['duration'] - 1;
          }
          } else {
            //check pending list for specific resource
            if(duration[i]['stat'] === 'on hold') {
              duration[i]['secondsOnHold'] = duration[i]['secondsOnHold'] + 1;
            }
            const stillPending = currentPending.filter((info) => info.resource === list[i]['resource'] && info.status === 'pending');

            if(stillPending.length === 0) {
              list[i]['user'] = '';
              list[i]['duration'] = '';
              list[i]['status'] = 'done';
              duration[i]['stat'] = 'free';
            } else {
              //resource still has pending users
              for(var j = 0; j < currentPending.length; j++) {
                //check if user is still using a resource then dont swap
                if(currentPending[j]['resource'] === list[i]['resource'] && currentPending[j]['status'] != 'ongoing') {
                  const found = list.filter((info) => info.user === currentPending[j]['user'] && info.status !== 'pending users still busy' && info.status !== 'done'); 
                  console.log(found)
                  //if free then swap
                  if(found.length === 0) {
                    //do swapping        
                    list[i]['user'] = currentPending[j]['user'];
                    list[i]['duration'] = currentPending[j]['duration'];
                    list[i]['status'] = 'ongoing';

                    currentPending[j]['user'] = 'ongoing';
                    currentPending[j]['resource'] = 'ongoing';
                    currentPending[j]['status'] = 'ongoing';
                    break;
                  } else {
                    //if not free, go to next user
                    list[i]['status'] = 'pending users still busy';
                    duration[i]['stat'] = 'on hold';
                  }
                }
              }
            }
          }
    setCounters(list);
  }
}

  React.useEffect(() => {
    const resourceLabels = generateResourcesUsers();
    const userLabels = generateResourcesUsers();
    const list = assignResourcesToUsers(resourceLabels, userLabels)
    const initialPending = setPriority(list);
    const data =  setInitialOngoing(initialPending, resourceLabels);
    setOngoing(data.ongoing);
    setPending(data.pending);

  },[]);

  React.useEffect(() => {
      if(start === true) {
        setInterval(function () {
          setUse();
          }, 1000); 
      }
  },[start]);

  //
  return (
    <main>
      <div className='resource-title'>
      <h1 className="resource-name">
        RESOURCE MANAGER
      </h1>
      </div>
      <div className='name-title'>
        <h1 className="text-name">
        ALLERITE, MARY JOY A. | MP1
        </h1>
      </div>
      <h1 className="text-start header">
        <button className='refresh-btn' onClick={() => window.location.reload()}>
        REFRESH
      </button>
      </h1>
      <br/>
      <br/>
      <br/>
      <div className="row">
      <div className="col-sm-6">
           <Table
            type={"ongoing"}
            tableData={ongoing}
            // counters={counters}
            headingColumns={["Current User","Resource ID", "Duration (seconds)", "Resource Status"]}
            rowsPerPage={7}
            />
            <Table
            type={"resources"}
            tableData={totalDuration}
            headingColumns={["Resource", "Total Seconds Left For Resource To Be Free", "Total Seconds On Hold", "Status"]}
            rowsPerPage={3}
            />
        </div>
        <div className="col-sm-6">
          <Table
            type={"pending"}
            tableData={pending}
            newPending={newPending}
            headingColumns={["User","Resource ID","Duration (seconds)", "Status"]}
            rowsPerPage={16}
            />
        </div>
      </div>
    </main>
  );
}

export default App;