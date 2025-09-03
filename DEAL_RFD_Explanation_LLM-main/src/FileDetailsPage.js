import React, { useState, useEffect, useContext, useMemo, useCallback } from 'react';
import { ReactComponent as DatabaseIcon } from 'bootstrap-icons/icons/database.svg';
import { ReactComponent as AspectRatioIcon } from 'bootstrap-icons/icons/aspect-ratio.svg';
import { ReactComponent as ColumnsIcon } from 'bootstrap-icons/icons/columns.svg';
import { ReactComponent as PcDisplayIcon } from 'bootstrap-icons/icons/pc-display.svg';
import { ReactComponent as ChartIcon } from 'bootstrap-icons/icons/diagram-2.svg';
import { ReactComponent as BugIcon } from 'bootstrap-icons/icons/bug.svg';
import { ReactComponent as CpuIcon } from 'bootstrap-icons/icons/cpu.svg';
import { ReactComponent as RobotIcon } from 'bootstrap-icons/icons/robot.svg';
import { ReactComponent as PcIcon } from 'bootstrap-icons/icons/pc-horizontal.svg';
import { ReactComponent as MoonIcon } from 'bootstrap-icons/icons/moon-fill.svg';
import { ReactComponent as SunIcon } from 'bootstrap-icons/icons/brightness-high-fill.svg';
import { ReactComponent as InfoIcon } from 'bootstrap-icons/icons/info.svg';
import { DarkModeContext } from './DarkModeProvider';
import { v4 as uuidv4 } from 'uuid';
import ReactApexChart from 'react-apexcharts';
import { Bar, Pie } from 'react-chartjs-2';
import 'chart.js/auto';
import './FileDetailsPage.css';
import './DarkModeProvider.css'; 
import axios from 'axios';

const { gemmaHandleUserInput} = require ('./gemmaapi.js'); // If it doesn't work, replace the key in 'ai21api.js'
const { chatGPTHandleUserInput } = require('./chatgptapi.js'); // If it doesn't work, replace the key in 'chatgptapi.js'
const { llamaHandleUserInput } = require('./llamaapi-backup.js'); // If it doesn't work, replace 'llamaapi.js' with 'llamaapi-backup.js'

const FileDetailsPage = ({ fileName, onBack }) => {
  const { darkMode, toggleDarkMode } = useContext(DarkModeContext);

  const [fileContent, setFileContent] = useState([]);
  const [allRFDs, setAllRFDs] = useState([]); 
  const [selectedRFDIds, setSelectedRFDIds] = useState([]); 
  const [isLoading, setIsLoading] = useState(false);
  const [isTextGenerated, setIsTextGenerated] = useState(false);
  const [responseAI, setResponseAI] = useState();
  
  const [isLoading2, setIsLoading2] = useState(false);
  const [isTextGenerated2, setIsTextGenerated2] = useState(false);
  const [responseAI2, setResponseAI2] = useState();
  
  const initialPrompts = useMemo(() => ({
    'RFDs Overview': "",
    'Mean, Median, and Mode': "Additionally, given these dependencies, the values of mean, median, and mode are as follows:\n",
    'Most Common Values': "This is the distribution of the most common values ​​for each column header:\n",
    'Stats': "I also would like an overall summary that explains how these statistics interact with each other, "+
      "and their impact on data, how these values are distributed across different headers and the significance of this distribution for an overall understanding of the dataset."
  }), []);

  const prompts = useMemo(() => ({
    'RFDs Overview':
      "I would like a thorough understanding of the RFD (Relational Functional Dependency) dependencies listed below. An RFD is a relationship between variables where a set of attributes (lhs - left-hand side) " +
      "determines another attribute (rhs - right-hand side), with specific tolerance thresholds indicated. The notation for an RFD is structured as follows: attribute@[thr_x], attribute@[thr_y], ... -> attribute@[thr_z], " +
      "where the square brackets contain the tolerance threshold used to compare the similarity of the attribute's values. Provide an explanation of each dependency, based on the attribute names and associated tolerance thresholds, " +
      "delving into the semantic aspects of how these attributes interact. Describe how this information affects these relationships and how the semantic meaning of the attribute names characterizes the dependency in the real world. The dependencies are as follows:\n",
    'RFDs Analysis with Stats': ''
  }), []);
  

  const getColors = (darkMode) => {
    return {
      text: darkMode ? '#e0e0e0' : '#000000',
      grid: darkMode ? '#444444' : '#e0e0e0',
      background: darkMode ? '#1e1e1e' : '#ffffff',
    };
  };

  const [selectedLLM, setSelectedLLM] = useState('ChatGPT3.5');
  const [selectedPrompt, setSelectedPrompt] = useState('RFDs Overview');
  const [customPromptAI, setCustomPromptAI] = useState('');
  const [basePrompt, setBasePrompt] = useState('');

  useEffect(() => {
    const newBasePrompt = prompts[selectedPrompt];
    setBasePrompt(newBasePrompt);
  
    const selectedRFDs = selectedRFDIds.map(id => {
      const rfdObj = allRFDs.find(rfd => rfd.id === id);
      return rfdObj ? rfdObj.rfd : '';
    }).filter(rfd => rfd !== '');
  
    const newPrompt = [newBasePrompt, ...selectedRFDs].join('\n');
    setCustomPromptAI(newPrompt);
  }, [selectedPrompt, selectedRFDIds, allRFDs, prompts]);
  
  

  const handleScroll = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };
 
  const [cardVisibility, setCardVisibility] = useState({
    infoDataset: true,
    header: true,
    details: true,
    contentSpecifications: true,
    algorithm: true,
    executionInfo: true,
    system: true,
    executionParameters: true,
    result: true,
    timeExecution: true,
    timeExecution2: true,
    timeLeft: true,
    ramUsage: true,
    error: true,
    cardinality: true,
    frequency: true,
    implicating: true,
    boxplot: true,
    minmax: true,
    nullValues: true,
    column: true,
    rfd: true,
    prompt: true,
    explanation: true,
    summary: true
  });

  const [visibility, setVisibility] = useState({
    explanation2: false,
    summary2: false
  })


  const info = {
    name: [],
    header: [],

    size: [],
    format: [],
    separator: [],

    col_number: [],
    row_number: [],
    blank_char: [],

    //name: [],
    language: [],
    platform: [],
    execution_type: [],
    
    os: [],
    os_version: [],
    processor: [],
    thread: [],
    core: [],
    ram: [],

    execution_command: [],
    max_execution_time: [],
    max_ram_usage: [],
    start_time: [],
    end_time: [],

    unit: [],
    dataset_loading: [],
    preprocessing: [],
    discovery: [],
    total: [],

    //unit: [],
    max_ram_used: [],

    time_limit: [],
    memory_limit: [],
    general_error: []
  };

  const header = [];

  const statistics = {
    type: [],
    mean: [],
    median: [],
    mode: [],
    min: [],
    max: [],
    distribution: []
  };
  
  // RETRIEVING FILE

  useEffect(() => {
    axios.get(`http://localhost:5000/files/${fileName}`)
      .then(response => {
        const data = response.data;
        if (data) {
          const formattedData = Object.entries(data).map(([key, value]) => ({ key, value }));
          setFileContent(formattedData);
          extractLhsAndRhs(data);
        } else {
          console.error('Undefined or null data');
        }
      })
      .catch(error => {
        console.error(error);
        alert('Error retrieving file contents');
      });
  }, [fileName]);

  // EXTRACT INFORMATION

  const formatData = (obj, depth = 0) => {
    return Object.entries(obj).map(([key, value]) => {
      const indent = '  '.repeat(depth);
      if (key === 'header') {
        header.push(value);
      }
      if (key === 'statistics' && typeof value === 'object' && value !== null) {
        Object.entries(value).forEach(([statKey, statValue]) => {
          if (statistics.hasOwnProperty(statKey) && typeof statistics[statKey] === 'object') {
            Object.entries(statValue).forEach(([innerKey, innerValue]) => {
              const uniqueValues = new Set(statistics[statKey][innerKey]);
              if (!uniqueValues.has(innerValue)) {
                statistics[statKey][innerKey] = innerValue;
              }
            });
          }
        });
      }
      if (typeof value === 'object' && value !== null) {
        return `${indent}${key}: ${formatData(value, depth + 1)}`;
      }
      if (info.hasOwnProperty(key)) {
        const uniqueValues = new Set(info[key]);
        if (!uniqueValues.has(value)) {
          info[key].push(value);
          }
        }
        return null;
    });
  };

  // MAKE THE RFDS

  const extractLhsAndRhs = (data) => {
    const extractedRFDs = [];
    if (data && data.length) {
      data.forEach(item => {
        if (item.execution && item.execution.result && item.execution.result.data && item.execution.result.data.length) {
          item.execution.result.data.forEach(resultData => {
            if (resultData.lhs && resultData.rhs) {
              const lhsColumns = resultData.lhs.map(lhsItem => `${lhsItem.column}@[${lhsItem.comparison_relaxation.toFixed(1)}]`).join(', ');
              const rhsColumns = resultData.rhs.map(rhsItem => `${rhsItem.column}@[${rhsItem.comparison_relaxation.toFixed(1)}]`).join(', ');
              const rfdString = `${lhsColumns} -> ${rhsColumns}`;
              extractedRFDs.push({ id: uuidv4(), rfd: rfdString });
            }
          });
        }
      });
    }
    setAllRFDs(extractedRFDs);
  };
  
  // HIDE/SELECT ROWS/CARDS

  const toggleRowSelection = (id) => {
    setSelectedRFDIds(prevSelectedIds => {
      const selectedIndex = prevSelectedIds.indexOf(id);
  
      const updatedSelectedIds = selectedIndex === -1 ? [...prevSelectedIds, id] : prevSelectedIds.filter(i => i !== id);
      updateCustomPrompt(id, selectedIndex === -1);
  
      return updatedSelectedIds;
    });
  };
  
  
  const toggleSelectAll = () => {
  const visibleRFDsIds = filteredRFDs.map(rfdObj => rfdObj.id);

  setSelectedRFDIds(prevSelectedIds => {
    const newSelectedIds = prevSelectedIds.length === visibleRFDsIds.length ? [] : visibleRFDsIds;

    setCustomPromptAI(prevPrompt => {
      const promptString = String(initialPrompts[selectedPrompt]); 
      const selectedRFDs = newSelectedIds.map(id => {
        const rfdObj = allRFDs.find(rfd => rfd.id === id);
        return rfdObj ? rfdObj.rfd : '';
      }).filter(rfd => rfd !== '');
      
      return [promptString, ...selectedRFDs].join('\n');
    });

    return newSelectedIds;
  });
};

  
  

  const [selectedHeaderValues, setSelectedHeaderValues] = useState([]);
  const toggleHeaderSelection = (value) => {
    setSelectedHeaderValues(prevSelected => {
      if (prevSelected.includes(value)) {
        return prevSelected.filter(item => item !== value);
      } else {
        return [...prevSelected, value];
      }
    });
  };

  fileContent.forEach(row => formatData(row));

  const toggleCardVisibility = (cardName) => {
    if (cardName === 'header' && cardVisibility.header) {
      setMenuOpenInfoHeader(false);
    }
    if (cardName === 'details' && cardVisibility.details) {
      setMenuOpenInfoDetails(false);
    }
    if (cardName === 'contentSpecifications' && cardVisibility.contentSpecifications) {
      setMenuOpenInfoContentSpecifications(false);
    }
    if (cardName === 'boxPlot' && cardVisibility.boxPlot) {
      setMenuOpenInfoBoxPlot(false);
    }
    if (cardName === 'minMax' && cardVisibility.minMax) {
      setMenuOpenInfoMinMax(false);
    }
    if (cardName === 'nullValues' && cardVisibility.nullValues) {
      setMenuOpenInfoNullValues(false);
    }
    if (cardName === 'column' && cardVisibility.column) {
      setMenuOpenInfoColumn(false);
    }
    if (cardName === 'algorithm' && cardVisibility.algorithm) {
      setMenuOpenInfoAlgorithm(false);
    }
    if (cardName === 'system' && cardVisibility.system) {
      setMenuOpenInfoSystem(false);
    }
    if (cardName === 'executionParameters' && cardVisibility.executionParameters) {
      setMenuOpenInfoExecutionParameters(false);
    }
    if (cardName === 'timeExecution' && cardVisibility.timeExecution) {
      setMenuOpenInfoTimeExecution(false);
    }
    if (cardName === 'timeExecution2' && cardVisibility.timeExecution2) {
      setMenuOpenInfoTimeExecution2(false);
    }
    if (cardName === 'ramUsage' && cardVisibility.ramUsage) {
      setMenuOpenInfoRamUsage(false);
    }
    if (cardName === 'error' && cardVisibility.error) {
      setMenuOpenInfoError(false);
    }
    if (cardName === 'cardinality' && cardVisibility.cardinality) {
      setMenuOpenInfoCardinality(false);
    }
    if (cardName === 'frequency' && cardVisibility.frequency) {
      setMenuOpenInfoFrequency(false);
    }
    if (cardName === 'implicating' && cardVisibility.implicating) {
      setMenuOpenInfoImplicating(false);
    }  
    if (cardName === 'rfd' && cardVisibility.rfd) {
      setMenuOpenInfoRFD(false);
      setMenuOpenFilter(false);
    }
    if (cardName === 'prompt' && cardVisibility.prompt) {
      setMenuOpenInfoPrompt(false);
    }

    setCardVisibility({ ...cardVisibility, [cardName]: !cardVisibility[cardName] });
  };


  // GENERATE TEXT
  const handleLLMChange = (e) => {
    setSelectedLLM(e.target.value);
  };

  const handlePromptChange = (event) => {
    setSelectedPrompt(event.target.value);
  };
  
  const handleTextareaChange = (e) => {
    setCustomPromptAI(e.target.value);
  };

  const updateCustomPrompt = (id, isAdding) => {
    const rfdObj = allRFDs.find(rfd => rfd.id === id);
    if (!rfdObj) return;
    const rfdToToggle = rfdObj.rfd;
  
    setCustomPromptAI(prevPrompt => {
      const basePrompt = prompts[selectedPrompt];
      const selectedRFDs = selectedRFDIds.map(rfdId => {
        const rfd = allRFDs.find(r => r.id === rfdId);
        return rfd ? rfd.rfd : '';
      }).filter(rfd => rfd !== '');
  
      return [basePrompt, ...selectedRFDs].join('\n');
    });
  };
  
  
  
  
  const scrollToBottom = async () => {

    if (selectedRFDIds.length === 0) {
      alert('Select one or more RFDs');
      return;
    }
    
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });

    await new Promise(resolve => {
      const checkIfScrolled = () => {
        if (window.innerHeight + window.scrollY >= document.body.scrollHeight) {
          resolve();
        } else {
          requestAnimationFrame(checkIfScrolled);
        }
      };
      checkIfScrolled();
    });

    setVisibility({
      ...cardVisibility,
      explanation2: true,
    });

    
      setIsLoading(true);

      let response = "";

      if (selectedLLM === 'ChatGPT3.5') {
        response = await chatGPTHandleUserInput(JSON.stringify(customPromptAI));
      } else if (selectedLLM === 'Llama3') {
        response = await llamaHandleUserInput(JSON.stringify(customPromptAI));
      } else if (selectedLLM === 'Gemma') {
        response = await gemmaHandleUserInput(JSON.stringify(customPromptAI));
      } else {  
        response = 'Invalid LLM selected';
      }


      setResponseAI(response);
      setIsTextGenerated(true);
      setIsLoading(false);
    
  };

  const summarizeText = async () => {
  
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  
    await new Promise(resolve => {
      const checkIfScrolled = () => {
        if (window.innerHeight + window.scrollY >= document.body.scrollHeight) {
          resolve();
        } else {
          requestAnimationFrame(checkIfScrolled);
        }
      };
      checkIfScrolled();
    });
  
    setVisibility({
      ...cardVisibility,
      summary2: true,
      explanation2: true
    });
    
      setIsLoading2(true);
  
      let response = "";
      
      if (selectedLLM === 'ChatGPT3.5') {
        response = await chatGPTHandleUserInput('Can you provide a comprehensive summary of the following analysis, emphasizing the semantic relationships and real-world implications of the functional dependencies: ' + responseAI);
      } else if (selectedLLM === 'Llama3') {
        response = await llamaHandleUserInput('Can you provide a comprehensive summary of the following analysis, emphasizing the semantic relationships and real-world implications of the functional dependencies: ' + responseAI);
      } else if (selectedLLM === 'Gemma') {
        response = await gemmaHandleUserInput('Can you provide a comprehensive summary of the following analysis, emphasizing the semantic relationships and real-world implications of the functional dependencies: ' + responseAI);
      } else {  
        response = 'Invalid LLM selected';
      }
  
      setResponseAI2(response);
      setIsTextGenerated2(true);
      setIsLoading2(false);
    
  };
  
  // FILTER RFD

  const [cardinalityValues, setCardinalityValues] = useState([]);
  const [frequencyValues, setFrequencyValues] = useState([]);
  const [implicatingValues, setImplicatingValues] = useState([]);

  const [filteredRFDs, setFilteredRFDs] = useState([]);

  const filterRFDs = (rfdArray, attributesHeader, cardinality, frequency, implicating) => {
    if (!Array.isArray(rfdArray)) return [];
    
    let filteredArray = rfdArray.filter(rfdObj => {
      const rfd = rfdObj.rfd;
      return !attributesHeader.some(attribute => rfd.includes(attribute));
    });
    
    
    if (frequency.length > 0) {
      frequency.forEach(freq => {
        const match = freq.match(/\[(.*?)\] (LHS|RHS)/);
        if (match) {
          const value = match[1];
          const type = match[2];
  
          filteredArray = filteredArray.filter(rfdObj => {
            const [lhs, rhs] = rfdObj.rfd.split(' -> ');
            if (type === 'LHS') {
              return !lhs.includes(`[${value}]`);
            } else if (type === 'RHS') {
              return !rhs.includes(`[${value}]`);
            }
    
            return false;
          });
        }
      });
    }
    
    if (cardinality.length > 0) {
      const cardinalityValues = cardinality.map(card => parseInt(card.match(/^(\d+)/)[1]));
  
      filteredArray = filteredArray.filter(rfdObj => {
        const lhs = rfdObj.rfd.split(' -> ')[0];
        const lhsAttributesCount = lhs.split(',').length;
  
        return !cardinalityValues.includes(lhsAttributesCount);
      });
    }
  
    if (implicating.length > 0) {
      filteredArray = filteredArray.filter(rfdObj => {
        const rhs = rfdObj.rfd.split(' -> ')[1];
        const rhsAttributes = rhs.split(',').map(attr => attr.split('@')[0].trim());
        return !implicating.some(value => rhsAttributes.includes(value));
      });
    }
    
    return filteredArray;
  };
  
  
  useEffect(() => {
    setFilteredRFDs(filterRFDs(allRFDs, selectedHeaderValues, cardinalityValues, frequencyValues, implicatingValues));
  }, [allRFDs, selectedHeaderValues, cardinalityValues, frequencyValues, implicatingValues]);

  const [menuOpenInfoHeader, setMenuOpenInfoHeader] = useState(false);
  const toggleMenuInfoHeader = () => {
    if (cardVisibility.header) {
      setMenuOpenInfoHeader(!menuOpenInfoHeader);
    }
  };

  const [menuOpenInfoDetails, setMenuOpenInfoDetails] = useState(false);
  const toggleMenuInfoDetails = () => {
    if (cardVisibility.details) {
      setMenuOpenInfoDetails(!menuOpenInfoDetails);
    }
  };

  const [menuOpenInfoContentSpecifications, setMenuOpenInfoContentSpecifications] = useState(false);
  const toggleMenuInfoContentSpecifications = () => {
    if (cardVisibility.contentSpecifications) {
      setMenuOpenInfoContentSpecifications(!menuOpenInfoContentSpecifications);
    }
  };

  const [menuOpenInfoBoxPlot, setMenuOpenInfoBoxPlot] = useState(false);
  const toggleMenuInfoBoxPlot = () => {
    if (cardVisibility.boxplot) {
      setMenuOpenInfoBoxPlot(!menuOpenInfoBoxPlot);
    }
  };

  const [menuOpenInfoMinMax, setMenuOpenInfoMinMax] = useState(false);
  const toggleMenuInfoMinMax = () => {
    if (cardVisibility.minmax) {
      setMenuOpenInfoMinMax(!menuOpenInfoMinMax);
    }
  };

  const [menuOpenInfoNullValues, setMenuOpenInfoNullValues] = useState(false);
  const toggleMenuInfoNullValues = () => {
    if (cardVisibility.nullValues) {
      setMenuOpenInfoNullValues(!menuOpenInfoNullValues);
    }
  };

  const [menuOpenInfoColumn, setMenuOpenInfoColumn] = useState(false);
  const toggleMenuInfoColumn = () => {
    if (cardVisibility.column) {
      setMenuOpenInfoColumn(!menuOpenInfoColumn);
    }
  };

  const [menuOpenInfoAlgorithm, setMenuOpenInfoAlgorithm] = useState(false);
  const toggleMenuInfoAlgorithm = () => {
    if (cardVisibility.algorithm) {
      setMenuOpenInfoAlgorithm(!menuOpenInfoAlgorithm);
    }
  };

  const [menuOpenInfoSystem, setMenuOpenInfoSystem] = useState(false);
  const toggleMenuInfoSystem = () => {
    if (cardVisibility.system) {
      setMenuOpenInfoSystem(!menuOpenInfoSystem);
    }
  };

  const [menuOpenInfoExecutionParameters, setMenuOpenInfoExecutionParameters] = useState(false);
  const toggleMenuInfoExecutionParameters = () => {
    if (cardVisibility.executionParameters) {
      setMenuOpenInfoExecutionParameters(!menuOpenInfoExecutionParameters);
    }
  };

  const [menuOpenInfoTimeExecution, setMenuOpenInfoTimeExecution] = useState(false);
  const toggleMenuInfoTimeExecution = () => {
    if (cardVisibility.timeExecution) {
      setMenuOpenInfoTimeExecution(!menuOpenInfoTimeExecution);
    }
  };

  const [menuOpenInfoTimeExecution2, setMenuOpenInfoTimeExecution2] = useState(false);
  const toggleMenuInfoTimeExecution2 = () => {
    if (cardVisibility.timeExecution2) {
      setMenuOpenInfoTimeExecution2(!menuOpenInfoTimeExecution2);
    }
  };

  const [menuOpenInfoRamUsage, setMenuOpenInfoRamUsage] = useState(false);
  const toggleMenuInfoRamUsage = () => {
    if (cardVisibility.ramUsage) {
      setMenuOpenInfoRamUsage(!menuOpenInfoRamUsage);
    }
  };

  const [menuOpenInfoError, setMenuOpenInfoError] = useState(false);
  const toggleMenuInfoError = () => {
    if (cardVisibility.error) {
      setMenuOpenInfoError(!menuOpenInfoError);
    }
  };

  const [menuOpenInfoCardinality, setMenuOpenInfoCardinality] = useState(false);
  const toggleMenuInfoCardinality = () => {
    if (cardVisibility.cardinality) {
      setMenuOpenInfoCardinality(!menuOpenInfoCardinality);
    }
  };

  const [menuOpenInfoFrequency, setMenuOpenInfoFrequency] = useState(false);
  const toggleMenuInfoFrequency = () => {
    if (cardVisibility.frequency) {
      setMenuOpenInfoFrequency(!menuOpenInfoFrequency);
    }
  };

  const [menuOpenInfoImplicating, setMenuOpenInfoImplicating] = useState(false);
  const toggleMenuInfoImplicating = () => {
    if (cardVisibility.implicating) {
      setMenuOpenInfoImplicating(!menuOpenInfoImplicating);
    }
  };
  
  const [menuOpenInfoRFD, setMenuOpenInfoRFD] = useState(false);
  const toggleMenuInfoRFD = () => {
    if (cardVisibility.rfd) {
      setMenuOpenInfoRFD(!menuOpenInfoRFD);
    }
  };

  const [menuOpenFilter, setMenuOpenFilter] = useState(false);
  const toggleMenuFilter = () => {
    if (cardVisibility.rfd) {
      setMenuOpenFilter(!menuOpenFilter);
    }
  };
  
  const [menuOpenInfoPrompt, setMenuOpenInfoPrompt] = useState(false);
  const toggleMenuInfoPrompt = () => {
    if (cardVisibility.prompt) {
      setMenuOpenInfoPrompt(!menuOpenInfoPrompt);
    }
  };

  const [activeButtons, setActiveButtons] = useState({
    infoHeader: false,
    infoDetails: false,
    infoContentSpecifications: false,
    infoBoxPlot: false,
    infoMinMax: false,
    infoNullValues: false,
    infoColumn: false,
    infoAlgorithm: false,
    infoSystem: false,
    infoExecutionParameters: false,
    infoTimeExecution: false,
    infoTimeExecution2: false,
    infoRamUsage: false,
    infoError: false,
    infoCardinality: false,
    infoFrequency: false,
    infoImplicating: false,
    infoRFD: false,
    filter: false,
    infoPrompt: false,
  });

  const handleMenuClick = (buttonType) => {
    setActiveButtons(prevState => ({
      ...prevState,
      [buttonType]: !prevState[buttonType],
    }));
  };

  // CHARTS

  const gradientColors = useMemo(() => [
    'rgba(255, 128, 128, 1)',
    'rgba(255, 159, 128, 1)',
    'rgba(255, 191, 128, 1)',
    'rgba(255, 223, 128, 1)',
    'rgba(255, 255, 128, 1)',
    'rgba(223, 255, 128, 1)',
    'rgba(191, 255, 128, 1)',
    'rgba(159, 255, 128, 1)',
    'rgba(128, 255, 128, 1)',
    'rgba(128, 255, 159, 1)',
    'rgba(128, 255, 191, 1)',
    'rgba(128, 255, 223, 1)',
    'rgba(128, 255, 255, 1)',
    'rgba(128, 223, 255, 1)',
    'rgba(128, 191, 255, 1)',
    'rgba(128, 159, 255, 1)',
    'rgba(128, 128, 255, 1)',
    'rgba(159, 128, 255, 1)',
    'rgba(191, 128, 255, 1)',
    'rgba(223, 128, 255, 1)',
    'rgba(255, 128, 255, 1)'
  ], []);
  

  // CHART: TIME EXECUTION

  const convertTimestampToReadable = (timestamp, locale = 'it-IT', options = {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZoneName: 'short'
  }) => {

      if (timestamp.toString().length === 10) {

          const date = new Date(timestamp * 1000);
          
          return date.toLocaleString(locale, options);
      } else {
          return timestamp;
      }
  };

  const formatTime = (time) => {
    if (time === 0) {
      return 'N/A';
    } else if (time > 1000) {
      return `${(time / 1000).toFixed(2).replace('.', ',')}s`;
    } else {
      return `${time}ms`;
    }
  };


  const convertToFloatArray = (data) => {
    if (Array.isArray(data) && data.length > 0) {
      return data.map(value => {
        if (value !== null && /^[a-zA-Z]$/.test(value) && value.endsWith('s')) {
          return 1000;
        } else if (value !== null && value.endsWith('s')) {
          return parseFloat(value.slice(0, -1).replace(',', '.')) * 1000;
        } else if (value !== null) {
          return parseFloat(value.replace(',', '.'));
        } else {
          return 0;
        }
      });
    } else {
      console.error('Invalid data format or empty array');
      return [];
    }
  };
    
  const temp = {
    dataset_loading: convertToFloatArray(info.dataset_loading),
    preprocessing: convertToFloatArray(info.preprocessing),
    discovery: convertToFloatArray(info.discovery),
    total: convertToFloatArray(info.total),
  };


  const left = temp.total.map((total, index) => {
    const discovery = temp.discovery[index] || 0;
    const preprocessing = temp.preprocessing[index] || 0;
    const dataset_loading = temp.dataset_loading[index] || 0;
    return total - (discovery + preprocessing + dataset_loading);
  });
  
  const totalSum = temp.total.reduce((acc, value) => acc + value, 0);
  const percentages = {
    dataset_loading: temp.dataset_loading.map(value => ((value / totalSum) * 100).toFixed(2)),
    preprocessing: temp.preprocessing.map(value => ((value / totalSum) * 100).toFixed(2)),
    discovery: temp.discovery.map(value => ((value / totalSum) * 100).toFixed(2)),
    left: left.map(value => ((value / totalSum) * 100).toFixed(2)),
  };
  
  const timeChartData = {
    labels: [''],
    datasets: [
      {
        label: 'Dataset Loading',
        data: percentages.dataset_loading,
        backgroundColor: gradientColors[0],
        borderColor: 'rgba(0, 0, 0, 1)',
        borderWidth: 0.5,
      },
      {
        label: 'Preprocessing',
        data: percentages.preprocessing,
        backgroundColor: gradientColors[5],
        borderColor: 'rgba(0, 0, 0, 1)',
        borderWidth: 0.5,
      },
      {
        label: 'Discovery',
        data: percentages.discovery,
        backgroundColor: gradientColors[10],
        borderColor: 'rgba(0, 0, 0, 1)',
        borderWidth: 0.5,
      },
      {
        label: 'Left',
        data: percentages.left,
        backgroundColor: gradientColors[15],
        borderColor: 'rgba(0, 0, 0, 1)',
        borderWidth: 0.5,
      }
    ],
  };

  const timeChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y',
    scales: {
      y: {
        stacked: true,
        ticks: {
          color: getColors(darkMode).text,
        },
        grid: {
          color: getColors(darkMode).grid,
        },
      },
      x: {
        stacked: true,
        beginAtZero: true,
        max: 100,
        ticks: {
          color: getColors(darkMode).text,
          callback: function (value) {
            return value + '%';
          }
        },
        grid: {
          color: getColors(darkMode).grid,
        },
      }
    },
    layout: {
      padding: {
        left: 20,
        right: 20,
      }
    },
    plugins: {
      tooltip: {
        callbacks: {
          label: function (tooltipItem) {
            let label = tooltipItem.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (tooltipItem.raw !== undefined) {
              let value = tooltipItem.raw;
              if (typeof value === 'number') {
                label += value.toFixed(2) + '%';
              } else {
                label += value + '%';
              }
            }
            return label;
          }
        },
        backgroundColor: getColors(darkMode).background,
        titleColor: getColors(darkMode).text,
        bodyColor: getColors(darkMode).text,
      }
    }
  };

  const isAllZerosOrNull = (arr) => arr.every(item => item === 0 || item === null || item === '');
  const shouldDisplayCard = !isAllZerosOrNull(temp.dataset_loading) || !isAllZerosOrNull(temp.preprocessing) || !isAllZerosOrNull(temp.discovery) || !isAllZerosOrNull(temp.total);

  // CHART: LHS CARDINALITY

  const countLHSAttributes = (rfdArray) => {
    const lhsCount = {};
    rfdArray.forEach(rfdObj => { 
      if (typeof rfdObj.rfd !== 'string') {
        console.error('RFD is not a string:', rfdObj);
        return; 
      }
      const lhs = rfdObj.rfd.split(' -> ')[0];
      const attributes = lhs.split(',').map(attr => attr.trim()).filter(attr => attr !== '');
      const numAttributes = attributes.length;
      if (!lhsCount[numAttributes]) {
        lhsCount[numAttributes] = 0;
      }
      lhsCount[numAttributes] += 1;
    });
  
    return lhsCount;
  };
  
  
  const lhsAttributesCount = countLHSAttributes(filteredRFDs); 

const lhsAttributeLabels = Object.keys(lhsAttributesCount).sort((a, b) => a - b);
const lhsAttributeData = lhsAttributeLabels.map(label => lhsAttributesCount[label]);

const lhsAttributeChartData = {
  labels: lhsAttributeLabels.map(label => `${label} attribute(s)`),
  datasets: [{
    label: 'LHS Cardinality',
    data: lhsAttributeData,
    backgroundColor: gradientColors[13],
    borderColor: 'rgba(0, 0, 0, 1)',
    borderWidth: 0.5,
  }],
};

  
  const lhsAttributeChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        stacked: true,
        ticks: {
          color: getColors(darkMode).text,
        },
        grid: {
          color: getColors(darkMode).grid,
        },
      },
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'LHS cardinality',
          color: getColors(darkMode).text,
        },
        ticks: {
          color: getColors(darkMode).text,
        },
        grid: {
          color: getColors(darkMode).grid,
        },
      }
    },
    plugins: {
      legend: {
        display: false,
        position: 'top',
        labels: {
          color: getColors(darkMode).text,
        },
      }
    },
    onClick: (event, elements) => {
      if (elements.length > 0) {
        const clickedBarIndex = elements[0].index;
        const clickedBarLabel = lhsAttributeChartData.labels[clickedBarIndex];
        handleLegendClickCardinality(clickedBarLabel);
      }
    }
  };
  
  const [labelsAndColorsCardinality, setLabelsAndColorsCardinality] = useState([]);

  const createLabelsAndColorsCardinality = useCallback(() => {
    return lhsAttributeLabels.map(label => [`${label} attribute(s)`, gradientColors[13]]);
  }, [lhsAttributeLabels, gradientColors]);
  
  useEffect(() => {
    if (labelsAndColorsCardinality.length === 0) {
      setLabelsAndColorsCardinality(createLabelsAndColorsCardinality());
    }
  }, [labelsAndColorsCardinality, createLabelsAndColorsCardinality]);
  
  
  const handleLegendClickCardinality = (legendText) => {
    const cardinalityIndex = cardinalityValues.indexOf(legendText);
    
    if (cardinalityIndex !== -1) {
      const newCardinalityValues = [...cardinalityValues];
      newCardinalityValues.splice(cardinalityIndex, 1);
      setCardinalityValues(newCardinalityValues);
    } else {
      setCardinalityValues([...cardinalityValues, legendText]);
    }

    setFilteredRFDs(filterRFDs(allRFDs, selectedHeaderValues, cardinalityValues, frequencyValues, implicatingValues));
  };


  // CHART: FREQUENCY

  const countVariableFrequency = (rfdArray) => {
    const variableFrequency = {};
    
    rfdArray.forEach(rfdObj => {
      if (typeof rfdObj.rfd !== 'string') {
        console.error('RFD is not a string:', rfdObj);
        return; 
      }
      const rfd = rfdObj.rfd;
      const [lhs, rhs] = rfd.split(' -> ');
      const lhsAttributes = lhs.split(', ').map(attr => attr.trim());
      const rhsAttributes = rhs.split(', ').map(attr => attr.trim());
      
      const processAttributes = (attributes, side) => {
        attributes.forEach(attribute => {
          const [col, value] = attribute.split('@');
          if (!variableFrequency[col]) {
            variableFrequency[col] = {};
          }
          if (!variableFrequency[col][value]) {
            variableFrequency[col][value] = { lhs: 0, rhs: 0 };
          }
          variableFrequency[col][value][side] += 1;
        });
      };
      
      processAttributes(lhsAttributes, 'lhs');
      processAttributes(rhsAttributes, 'rhs');
    });
    
    return variableFrequency;
  };
  
  
  const prepareChartData = (variableFrequency, header) => {
    const labels = Object.keys(variableFrequency);
    const datasets = [];
  
    const getColor = (index) => gradientColors[index % gradientColors.length];
  
    labels.sort((a, b) => {
      return header.indexOf(a) - header.indexOf(b);
    });
  
    const allValues = new Set();
    labels.forEach(col => {
      Object.keys(variableFrequency[col]).forEach(value => allValues.add(value));
    });
  
    const uniqueValues = Array.from(allValues).sort();
  
    if (labelsAndColorsFrequency.length === 0) {
      uniqueValues.forEach((value, index) => {
        const colorLHS = getColor(index * 2);
        const colorRHS = getColor(index * 2 + 1);
  
        labelsAndColorsFrequency.push([`${value} LHS`, colorLHS]);
        labelsAndColorsFrequency.push([`${value} RHS`, colorRHS]);
  
        datasets.push(
          {
            label: `${value} LHS`,
            data: labels.map(col => variableFrequency[col][value]?.lhs || 0),
            backgroundColor: colorLHS,
            borderColor: 'rgba(0, 0, 0, 1)',
            borderWidth: 0.5,
            stack: 'lhs'
          },
          {
            label: `${value} RHS`,
            data: labels.map(col => variableFrequency[col][value]?.rhs || 0),
            backgroundColor: colorRHS,
            borderColor: 'rgba(0, 0, 0, 1)',
            borderWidth: 0.5,
            stack: 'rhs'
          }
        );
      });
    } else {
      uniqueValues.forEach((value, index) => {
        const colorLHS = getColor(index * 2);
        const colorRHS = getColor(index * 2 + 1);
  
        datasets.push(
          {
            label: `${value} LHS`,
            data: labels.map(col => variableFrequency[col][value]?.lhs || 0),
            backgroundColor: colorLHS,
            borderColor: 'rgba(0, 0, 0, 1)',
            borderWidth: 0.5,
            stack: 'lhs'
          },
          {
            label: `${value} RHS`,
            data: labels.map(col => variableFrequency[col][value]?.rhs || 0),
            backgroundColor: colorRHS,
            borderColor: 'rgba(0, 0, 0, 1)',
            borderWidth: 0.5,
            stack: 'rhs'
          }
        );
      });
    }
  
    return { labels, datasets };
  };
  

  const variableChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          title: (context) => context[0].label,
          label: (context) => {
            const value = context.parsed.y;
            return `${context.dataset.label}: ${value}`;
          }
        },
        backgroundColor: getColors(darkMode).background,
        titleColor: getColors(darkMode).text,
        bodyColor: getColors(darkMode).text,
      }
    },
    scales: {
      x: {
        stacked: true,
        ticks: {
          color: getColors(darkMode).text,
        },
        grid: {
          color: getColors(darkMode).grid,
        },
      },
      y: {
        stacked: true,
        beginAtZero: true,
        ticks: {
          color: getColors(darkMode).text,
        },
        grid: {
          color: getColors(darkMode).grid,
        },
      },
    },
    onClick: (event, elements) => {
      if (elements.length > 0) {
        const hoveredElement = elements[0];
        const datasetIndex = hoveredElement.datasetIndex;
        const dataset = variableChartData.datasets[datasetIndex];
        const label = dataset.label;
        handleLegendClickFrequency(label);
      }
    }
  };
  

  const variableFrequency = countVariableFrequency(filterRFDs(allRFDs, selectedHeaderValues, cardinalityValues, frequencyValues, implicatingValues));
  
  const [labelsAndColorsFrequency] = useState([]);
  const variableChartData = prepareChartData(variableFrequency, header[0], labelsAndColorsFrequency);
  
  const handleLegendClickFrequency = (legendText) => {
    const frequencyIndex = frequencyValues.indexOf(legendText);
    
    if (frequencyIndex !== -1) {
      const newFrequencyValues = [...frequencyValues];
      newFrequencyValues.splice(frequencyIndex, 1);
      setFrequencyValues(newFrequencyValues);
    } else {
      setFrequencyValues([...frequencyValues, legendText]);
    }

    setFilteredRFDs(filterRFDs(allRFDs, selectedHeaderValues, cardinalityValues, frequencyValues, implicatingValues));
  };


  // CHART: IMPLICATING ATTRIBUTES
  const findImplicatingAttributes = (rfdArray, attributesHeader) => {
    const implicatingAttributes = {};
  
  
    const filteredAttributesHeader = attributesHeader.filter(
      attribute => !selectedHeaderValues.includes(attribute)
    );
  
    filteredAttributesHeader.forEach(attribute => {
      implicatingAttributes[attribute] = new Set();
      rfdArray.forEach(rfdObj => {
        if (typeof rfdObj.rfd !== 'string') {
          console.error('RFD is not a string:', rfdObj);
          return;
        }
        const [lhs, rhs] = rfdObj.rfd.split(' -> ');
  
        if (!rhs) {
          console.error('Invalid RFD format:', rfdObj.rfd);
          return;
        }
  
        const rhsAttribute = rhs.substring(0, rhs.indexOf('@')).trim();
  
        if (rhsAttribute === attribute) {
          const leftAttributes = lhs.match(/[a-zA-Z][a-zA-Z0-9]*/g)
            .filter(attr => !attr.includes('@'))
            .filter(attr => !selectedHeaderValues.includes(attr.trim())); 
  
          leftAttributes.forEach(attr =>
            implicatingAttributes[attribute].add(attr.trim())
          );
        }
      });
    });
  
    return implicatingAttributes;
  };
  

  

  let implicatingAttributes = 0;
  if(header[0]) {
    implicatingAttributes = findImplicatingAttributes(filterRFDs(allRFDs, selectedHeaderValues, cardinalityValues, frequencyValues, implicatingValues), header[0]);
  }


  const implicatingChartData = {
    labels: Object.keys(implicatingAttributes).map(label => `${label}`),
    datasets: Object.keys(implicatingAttributes).map(label => {
      const data = Object.keys(implicatingAttributes).map(key => {
        return key === label ? implicatingAttributes[key].size : 0;
      });

      return {
        label: `${label}`,
        data: data,
        backgroundColor: gradientColors[12],
        borderColor: 'rgba(0, 0, 0, 1)',
        borderWidth: 0.5,
      };
    }),
  };


  const implicatingChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        stacked: true,
        ticks: {
          color: getColors(darkMode).text,
        },
        grid: {
          color: getColors(darkMode).grid,
        },
      },
      y: {
        ticks: {
          color: getColors(darkMode).text,
        },
        grid: {
          color: getColors(darkMode).grid,
        },
      },
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const attribute = context.label;
            const implicatingAttrs = Array.from(implicatingAttributes[attribute]).join(', ');
            return `${attribute}: ${implicatingAttrs}`;
          }
        },
        backgroundColor: getColors(darkMode).background,
        titleColor: getColors(darkMode).text,
        bodyColor: getColors(darkMode).text,
      },
    },
    onClick: (event, elements) => {
      if (elements.length > 0) {
        const clickedBarIndex = elements[0].index;
        const clickedBarLabel = implicatingChartData.labels[clickedBarIndex];
        handleLegendClickImplicating(clickedBarLabel);
      }
    }
  }; 


  const [labelsAndColorsImplicating, setLabelsAndColorsImplicating] = useState([]);

  const createLabelsAndColorsImplicating = useCallback(() => {
    if (labelsAndColorsImplicating.length === 0) {
      return Object.keys(implicatingAttributes).map((label, index) => {
        return [`${label}`, gradientColors[12]];
      });
    } else {
      return labelsAndColorsImplicating;
    }
  }, [labelsAndColorsImplicating, implicatingAttributes, gradientColors]);

  useEffect(() => {
    if (labelsAndColorsImplicating.length === 0) {
      setLabelsAndColorsImplicating(createLabelsAndColorsImplicating());
    }
  }, [labelsAndColorsImplicating, createLabelsAndColorsImplicating]);


  const handleLegendClickImplicating = (legendText) => {
    const implicatingIndex = implicatingValues.indexOf(legendText);
    
    if (implicatingIndex !== -1) {
      const newImplicatingValues = [...implicatingValues];
      newImplicatingValues.splice(implicatingIndex, 1);
      setImplicatingValues(newImplicatingValues);
    } else {
      setImplicatingValues([...implicatingValues, legendText]);
    }

    setFilteredRFDs(filterRFDs(allRFDs, selectedHeaderValues, cardinalityValues, frequencyValues, implicatingValues));
  };

  useEffect(() => {
    setSelectedRFDIds([]);
    const newBasePrompt = prompts[selectedPrompt];
    setCustomPromptAI(newBasePrompt);
  }, [selectedHeaderValues, cardinalityValues, frequencyValues, implicatingValues, selectedPrompt]);
  


  // CHART: BOX PLOT

const filteredStatisticLabels = Object.keys(statistics.type).filter(label => !selectedHeaderValues.includes(label));
const statisticMeans = filteredStatisticLabels.map(label => statistics.mean[label]);
const statisticMedians = filteredStatisticLabels.map(label => statistics.median[label]);
const statisticModes = filteredStatisticLabels.map(label => statistics.mode[label]);


  const meansString = statisticMeans.join(' ');
  const mediansString = statisticMedians.join(' ');
  const modesString = statisticModes.join(' ');
  
  const appPrompt1 = initialPrompts[`Mean, Median, and Mode`] + `\n${header[0]}\n${meansString}\n${mediansString}\n${modesString}`;

  
  const options = {
    chart: {
      type: 'boxPlot',
      height: 350,
      background: getColors(darkMode).background,
      toolbar: {
        show: false
      }
    },
    title: {
      text: 'Box Plot',
      align: 'left',
      style: {
        color: getColors(darkMode).text,
      },
    },
    plotOptions: {
      boxPlot: {
        colors: {
          upper: darkMode ? '#A5978B' : '#5C4742',
          lower: darkMode ? '#5C4742' : '#A5978B'
        }
      }
    },
    xaxis: {
      type: 'category',
      labels: {
        formatter: function(val) {
          return val;
        },
        style: {
          colors: getColors(darkMode).text,
        },
      },
      title: {
        text: 'Statistics',
        style: {
          color: getColors(darkMode).text,
        },
      }
    },
    yaxis: {
      title: {
        text: 'Values',
        style: {
          color: getColors(darkMode).text,
        },
      },
      labels: {
        formatter: function(val) {
          return val.toFixed(2);
        },
        style: {
          colors: getColors(darkMode).text,
        },
      }
    },
    tooltip: {
      shared: false,
      intersect: true,
      theme: darkMode ? 'dark' : 'light',
      custom: function({ seriesIndex, dataPointIndex, w }) {
        const data = w.globals.initialSeries[seriesIndex].data[dataPointIndex];
        return (
          `<div class="apexcharts-tooltip-box-plot">
            <div><b>${data.x}</b></div>
            <div>Min: ${data.y[0].toFixed(2)}</div>
            <div>Mean: ${data.y[1].toFixed(2)}</div>
            <div>Median: ${data.y[2].toFixed(2)}</div>
            <div>Mode: ${data.y[3].toFixed(2)}</div>
            <div>Max: ${data.y[4].toFixed(2)}</div>
          </div>`
        );
      }
    }
  };

  const [currentPageBoxPlot, setcurrentPageBoxPlot] = useState(1);
  const chartsPerPageBoxPlot = 2;
  const totalChartsBoxPlot = Object.keys(statistics.type)
  .filter(label => !selectedHeaderValues.includes(label))
  .length;
  const totalPagesBoxPlot = Math.ceil(totalChartsBoxPlot / chartsPerPageBoxPlot);
  
  const getPaginatedChartsBoxPlot = () => {
    const filteredLabels = Object.keys(statistics.type)
      .filter(label => !selectedHeaderValues.includes(label));
  
    const start = (currentPageBoxPlot - 1) * chartsPerPageBoxPlot;
    const end = start + chartsPerPageBoxPlot;
  
    const statisticLabels = filteredLabels.slice(start, end);
    const seriesData = statisticLabels.map((label, index) => ({
      x: label,
      y: [
        statistics.min[label],
        statistics.mean[label],
        statistics.median[label],
        statistics.mode[label],
        statistics.max[label],
      ],
    }));
    return seriesData;
  };
  
  const handlePageChangeBoxPlot = (page) => {
    if (page >= 1 && page <= totalPagesBoxPlot) {
      setcurrentPageBoxPlot(page);
    }
  };
  
  const renderPaginationButtonsBoxPlot = () => {
    const pages = [];
  
    if (currentPageBoxPlot > 1) pages.push(<button key="first" onClick={() => handlePageChangeBoxPlot(1)} className="pagination-button">1</button>);
    if (currentPageBoxPlot > 3) pages.push(<span key="dots1" className="pagination-dots">...</span>);
    if (currentPageBoxPlot > 2) pages.push(<button key="prev" onClick={() => handlePageChangeBoxPlot(currentPageBoxPlot - 1)} className="pagination-button">{currentPageBoxPlot - 1}</button>);
  
    pages.push(<span key="current" className="pagination-button current-page">{currentPageBoxPlot}</span>);
  
    if (currentPageBoxPlot < totalPagesBoxPlot - 1) pages.push(<button key="next" onClick={() => handlePageChangeBoxPlot(currentPageBoxPlot + 1)} className="pagination-button">{currentPageBoxPlot + 1}</button>);
    if (currentPageBoxPlot < totalPagesBoxPlot - 2) pages.push(<span key="dots2" className="pagination-dots">...</span>);
    if (currentPageBoxPlot < totalPagesBoxPlot) pages.push(<button key="last" onClick={() => handlePageChangeBoxPlot(totalPagesBoxPlot)} className="pagination-button">{totalPagesBoxPlot}</button>);

    return pages;
  };


  // CHART: MIN MAX

  const minMaxLabels = Object.keys(statistics.type).filter(label => !selectedHeaderValues.includes(label));
const statisticMin = minMaxLabels.map(label => statistics.min[label]);
const statisticMax = minMaxLabels.map(label => statistics.max[label]);   

  const minMaxChartData = {
    labels:  minMaxLabels,
    datasets: [
      {
        label: 'Min',
        data: statisticMin,
        backgroundColor: gradientColors[13],
        borderColor: 'rgba(0, 0, 0, 1)',
        borderWidth: 0.5,
      },
      {
        label: 'Max',
        data: statisticMax,
        backgroundColor: gradientColors[14],
        borderColor: 'rgba(0, 0, 0, 1)',
        borderWidth: 0.5,
      },
    ],
  };

  const minMaxChartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          type: 'logarithmic',
          beginAtZero: true,
          min: 0,
          ticks: {
            color: getColors(darkMode).text,
          },
          grid: {
            color: getColors(darkMode).grid,
          },
        },
        x: {
          ticks: {
            color: getColors(darkMode).text,
          },
          grid: {
            color: getColors(darkMode).grid,
          },
        },
      },
      plugins: {
        legend: {
          labels: {
            color: getColors(darkMode).text
          }
        },
        tooltip: {
          backgroundColor: getColors(darkMode).background,
          titleColor: getColors(darkMode).text,
          bodyColor: getColors(darkMode).text,
        }
      },
    };



  // CHART: NULL VALUES

  const calculateNullPercentages = (distribution) => {
    const nullPercentages = {};
    
    for (const col in distribution) {
      const colData = distribution[col];
      let totalCount = 0;
      let nullCount = 0;
  
      for (const key in colData) {
        totalCount += colData[key].count;
        if (key === "" || key === "?" || key === "null" || key === "NA" || key === "NaN") {
          nullCount += colData[key].count;
        }
      }
  
      const nullPercentage = totalCount ? ((nullCount / totalCount) * 100).toFixed(2) : 0;
      nullPercentages[col] = {
        nullCount,
        nullPercentage
      };
    }
  
    return nullPercentages;
  };
  
  
  const nullPercentages = calculateNullPercentages(statistics.distribution);

  const nullValuesLabels = Object.keys(nullPercentages).filter(label => !selectedHeaderValues.includes(label));
  const nullPercentageValues = nullValuesLabels.map(label => parseFloat(nullPercentages[label].nullPercentage || 0));

  const nullValuesChartData = {
    labels: nullValuesLabels,
    datasets: [
      {
        label: 'Null Percentage',
        data: nullPercentageValues,
        backgroundColor: gradientColors[4],
        borderColor: '#000000',
        borderWidth: 0.5,
      },
    ],
  };

  const nullValuesChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        ticks: {
          color: getColors(darkMode).text,
        },
        grid: {
          color: getColors(darkMode).grid,
        },
      },
      x: {
        ticks: {
          color: getColors(darkMode).text,
        },
        grid: {
          color: getColors(darkMode).grid,
        },
      },
    },
    plugins: {
      legend: {
        labels: {
          color: getColors(darkMode).text
        }
      },
      tooltip: {
        backgroundColor: getColors(darkMode).background,
        titleColor: getColors(darkMode).text,
        bodyColor: getColors(darkMode).text,
      }
    }
  };



  // CHART: DISTRIBUTION (RELATIVE FREQUENCY)

  const calculateRelativeFrequency = (distribution) => {
    const relativeFrequency = {};
  
    Object.keys(distribution).forEach(attribute => {
      const attributeCounts = distribution[attribute];
      const total = Object.values(attributeCounts).reduce((sum, item) => sum + item.count, 0);
      relativeFrequency[attribute] = {};
  
      Object.keys(attributeCounts).forEach(value => {
        const count = attributeCounts[value].count;
        relativeFrequency[attribute][value] = (count / total) * 100;
      });
    });
  
    return relativeFrequency;
  };

  const relativeFrequency = calculateRelativeFrequency(statistics.distribution);
  const [chartDataLimit, setChartDataLimit] = useState({});

  const handleSliderChange = (attribute, value) => {
    setChartDataLimit(prevState => ({
      ...prevState,
      [attribute]: value
    }));
  };

  let allValues = '';

  Object.keys(relativeFrequency).forEach(attribute => {
    const dataLimit = chartDataLimit[attribute] || Math.min(Object.keys(relativeFrequency[attribute]).length, 10);
    const values = Object.keys(relativeFrequency[attribute]);
    const sortedValues = values.sort((a, b) => relativeFrequency[attribute][b] - relativeFrequency[attribute][a]);
    const displayedValues = sortedValues.slice(0, dataLimit);
    
    allValues += `\n${attribute}\n${displayedValues.join('\n')}`;
  });
  
  const appPrompt2 = initialPrompts[`Most Common Values`] + allValues;
  
  prompts['RFDs Analysis with Stats'] = prompts['RFDs Overview'] + '\n\nBelow you will find statistical values that will better enable you to understand the semantic meaning of dependence. Use them to describe dependencies.' + '\n ' + appPrompt1 + '\n\n ' + appPrompt2 + '\n\n' + initialPrompts['Stats'];


  const getChartDataForAttribute = useMemo(() => (attribute) => {
    const dataLimit = chartDataLimit[attribute] || Math.min(Object.keys(relativeFrequency[attribute]).length, 10);
    const allValues = Object.keys(relativeFrequency[attribute]);
    const sortedValues = allValues.sort((a, b) => relativeFrequency[attribute][b] - relativeFrequency[attribute][a]);
    const displayedValues = sortedValues.slice(0, dataLimit);
  
    const total = displayedValues.reduce((acc, value) => acc + relativeFrequency[attribute][value], 0);
  
    const data = displayedValues.map(value => (relativeFrequency[attribute][value] / total) * 100);
  
    return {
      labels: displayedValues.map(value => `${attribute}:${value}`),
      datasets: [{
        data: data,
        backgroundColor: gradientColors,
        label: 'Relative Frequency (%)'
      }]
    };
  }, [relativeFrequency, chartDataLimit, gradientColors]);
  
  
  const distributionChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      tooltip: {
        callbacks: {
          label: function(context) {
            const label = context.label.split(':')[1].trim();
            const value = context.raw.toFixed(2);
            return `${label}: ${value}%`;
          }
        },
        backgroundColor: '#343a40',
        titleFont: { size: 0 },
        bodyFont: { size: 14, color: getColors(darkMode).text },
        padding: 10,
        caretPadding: 5,
        caretSize: 5,
        cornerRadius: 4,
        borderWidth: 0.5,
        borderColor: '#ffffff',
        displayColors: false,
        titleMarginBottom: 0
      },
      legend: { 
        display: false 
      }
    },
    elements: {
      arc: {
        borderColor: getColors(darkMode).text,
        borderWidth: 0.2
      }
    }
  };
  
  const [currentPage, setCurrentPage] = useState(1);
  const chartsPerPage = 2;
  const totalCharts = Object.keys(relativeFrequency)
  .filter(attribute => !selectedHeaderValues.includes(attribute))
  .length;
  const totalPages = Math.ceil(totalCharts / chartsPerPage);

  const getPaginatedCharts = () => {
    const filteredAttributes = Object.keys(relativeFrequency)
      .filter(attribute => !selectedHeaderValues.includes(attribute));
  
    const start = (currentPage - 1) * chartsPerPage;
    return filteredAttributes.slice(start, start + chartsPerPage);
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const renderPaginationButtons = () => {
    const pages = [];

    if (currentPage > 1) pages.push(<button key="first" onClick={() => handlePageChange(1)} className="pagination-button">1</button>);
    if (currentPage > 3) pages.push(<span key="dots1" className="pagination-dots">...</span>);
    if (currentPage > 2) pages.push(<button key="prev" onClick={() => handlePageChange(currentPage - 1)} className="pagination-button">{currentPage - 1}</button>);

    pages.push(<span key="current" className="pagination-button current-page">{currentPage}</span>);

    if (currentPage < totalPages - 1) pages.push(<button key="next" onClick={() => handlePageChange(currentPage + 1)} className="pagination-button">{currentPage + 1}</button>);
    if (currentPage < totalPages - 2) pages.push(<span key="dots2" className="pagination-dots">...</span>);
    if (currentPage < totalPages) pages.push(<button key="last" onClick={() => handlePageChange(totalPages)} className="pagination-button">{totalPages}</button>);

    return pages;
  };
  

  const [isDropdownOpen, setDropdownOpen] = useState(false);

  const toggleDropdown = () => {
    setDropdownOpen(!isDropdownOpen);
  };

  const handleMenuItemClick = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setDropdownOpen(false); 
  };


  return (
      
      <div className={`file-details ${darkMode ? 'dark-mode' : ''}`}>

        <button className="back-btn" onClick={onBack}>
            <i className="fas fa-arrow-alt-circle-left" style={{ fontSize: "1.2em" }}></i>
        </button>
        <div className="title-back-container">
            <div className="sidebar">
                <button className="sidebar-icon" data-title="Dataset" activeClassName="active" onClick={() => handleMenuItemClick('dataset')}><DatabaseIcon /></button>
                <button className="sidebar-icon" data-title="Algorithm" activeClassName="active"onClick={() => handleMenuItemClick('algorithm')}><PcIcon /></button>
                <button className="sidebar-icon" data-title="Dependencies Analysis" activeClassName="active" onClick={() => handleMenuItemClick('dependencies')}><ChartIcon /></button>
            </div>
            
            <h2 className="title">File Details: {info.name[0]}</h2>
            
            <div className="toggle-button" onClick={toggleDarkMode}>
              <SunIcon name="sun" className="sun"></SunIcon>
              <MoonIcon name="moon" className="moon"></MoonIcon>
              <div className="toggle"></div>
              <div className="animateBg"></div>
            </div>
          </div>

        <div className="container">
          <h2 id="dataset" className="section">DATASET</h2>
          <div className="sticky-container">
          <div className="card mb-3">
            <div className="card-header"> 
              <span className="details-text">Header <DatabaseIcon /></span>

              <span
            className={`menu-trigger infoHeader ${!cardVisibility.header ? 'disabled' : ''} ${activeButtons.infoHeader ? 'active' : ''}`}
            onClick={() => {
              if (cardVisibility.header) {
                toggleMenuInfoHeader();
                handleMenuClick('infoHeader');
              }
            }}
              >
                  <InfoIcon style={{ width: '25px', height: '25px', marginTop: '3px' }} />
          </span>

          <div className={`menu infoHeader ${menuOpenInfoHeader ? 'open' : ''}`}>
              Contains the dataset column headers. The data type can be selected to filter the RFDs.
          </div>

            </div>
            {header && header[0] && (
              <div className="card-body">
                <div className="horizontal-scroll">
                  {header[0].map((item, index) => (
                    <div key={index} className="item-container">
                      <button
                        type="button"
                        className={`btn ${selectedHeaderValues.includes(item) ? 'btn-primary active' : 'btn btn-secondary'}`}
                        onClick={() => toggleHeaderSelection(item)}
                        style={{
                          background: selectedHeaderValues.includes(item) ? 'white' : 'linear-gradient(30deg, #5799E5, #005AC1)',
                          color: selectedHeaderValues.includes(item) ? 'black' : '',
                        }}
                      >
                        <span className={`details-header ${selectedHeaderValues.includes(item) ? 'selected' : ''}`}>{item}</span>
                      </button>
                      <div style={{ height: '5px' }}></div>
                      <button
                        type="button"
                        className={`btn ${selectedHeaderValues.includes(statistics.type[item]) ? 'btn-group-toggle active' : 'btn btn-secondary'} no-pulse`}
                        style={{ background: '#E1E1E1', cursor:"default" }}
                      >
                        <span className="details-header">{statistics.type[item]}</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>


        <div className="row">
      <div className="col-md-6">
        <div className="card mb-3">
          <div className="d-flex justify-content-between align-items-center card-header">
            <span className="details-text">Details <AspectRatioIcon /></span>


            <span
            className={`menu-trigger infoDetails ${!cardVisibility.details ? 'disabled' : ''} ${activeButtons.infoDetails ? 'active' : ''}`}
            onClick={() => {
              if (cardVisibility.details) {
                toggleMenuInfoDetails();
                handleMenuClick('infoDetails');
              }
            }}
              >
                  <InfoIcon style={{ width: '25px', height: '25px', marginTop: '3px' }} />
          </span>

          <div className={`menu infoDetails ${menuOpenInfoDetails ? 'open' : ''}`}>
            Provides a report on dataset information (size, format, separator character).
          </div>

            <div className="toggle-button-cover">
              <div id="button-3" className="button r">
                <input className="checkbox" type="checkbox" onChange={() => toggleCardVisibility('details')} checked={cardVisibility.details} />
                <div className="knobs"></div>
                <div className="layer"></div>
              </div>
            </div>
          </div>
          {cardVisibility.details && (
            <div className="card-body">
              {info.size.map((item, index) => (
                  <div key={index}>
                    <strong>Size:</strong> {item} <br />
                    <strong>Format:</strong> {info.format[index] !== null ? info.format[index] : 'N/A'} <br />
                    <strong>Separator:</strong> {info.separator[index] !== null ? info.separator[index] : 'N/A'}
                  </div>
                )
              )}
            </div>
          )}
        </div>
      </div>

      <div className="col-md-6">
        <div className="card mb-3">
          <div className="d-flex justify-content-between align-items-center card-header">
            <span className="details-text">Content Specifications <ColumnsIcon /></span>
            
            
            <span
            className={`menu-trigger infoContentSpecifications ${!cardVisibility.contentSpecifications ? 'disabled' : ''} ${activeButtons.infoContentSpecifications ? 'active' : ''}`}
            onClick={() => {
              if (cardVisibility.contentSpecifications) {
                toggleMenuInfoContentSpecifications();
                handleMenuClick('infoContentSpecifications');
              }
            }}
              >
                  <InfoIcon style={{ width: '25px', height: '25px', marginTop: '3px' }} />
          </span>

          <div className={`menu infoContentSpecifications ${menuOpenInfoContentSpecifications ? 'open' : ''}`}>
            Provides three specifications on the contents of the dataset (number of columns, rows, character to represent null values).
          </div>
            
            <div className="toggle-button-cover">
              <div id="button-3" className="button r">
                <input
                  className="checkbox"
                  type="checkbox"
                  onChange={() => toggleCardVisibility('contentSpecifications')}
                  checked={cardVisibility.contentSpecifications}
                />
                <div className="knobs"></div>
                <div className="layer"></div>
              </div>
            </div>
          </div>
          {cardVisibility.contentSpecifications && (
            <div className="card-body">
              {info.col_number.map((item, index) => (
                  <div key={index}>
                    <strong>Column:</strong> {item} <br />
                    <strong>Row:</strong> {info.row_number[index] !== null ? info.row_number[index] : 'N/A'} <br />
                    <strong>Blank char:</strong> {info.blank_char[index] !== null ? info.blank_char[index] : 'N/A'}
                  </div>
                )
              )}
            </div>
          )}
        </div>
        </div>
    </div>

    


    <div className="card mb-3">
      <div className="d-flex justify-content-between align-items-center card-header">
        <span className="details-text">BOX PLOT <ChartIcon /></span>

        
        <span
            className={`menu-trigger infoBoxPlot ${!cardVisibility.boxplot ? 'disabled' : ''} ${activeButtons.infoBoxPlot ? 'active' : ''}`}
            onClick={() => {
              if (cardVisibility.boxplot) {
                toggleMenuInfoBoxPlot();
                handleMenuClick('infoBoxPlot');
              }
            }}
              >
                  <InfoIcon style={{ width: '25px', height: '25px', marginTop: '3px' }} />
          </span>

          <div className={`menu infoBoxPlot ${menuOpenInfoBoxPlot ? 'open' : ''}`}>
            Shows the distribution of variable values ​​for each column of the dataset.
          </div>

        <div className="toggle-button-cover">
          <div id="button-3" className="button r">
            <input
              className="checkbox"
              type="checkbox"
              onChange={() => toggleCardVisibility('boxplot')}
              checked={cardVisibility.boxplot}
            />
            <div className="knobs"></div>
            <div className="layer"></div>
          </div>
        </div>
      </div>
      {cardVisibility.boxplot && (
        <div className="card-body">
          <div className="row">
            {getPaginatedChartsBoxPlot().map((seriesItem, index) => (
              <div key={index} className="col-md-6 mb-3">
                <ReactApexChart options={options} series={[{ type: 'boxPlot', data: [seriesItem] }]} type="boxPlot" height={350} />
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="pagination-container d-flex justify-content-center mt-3">
        <div className="pagination-bar">
          <button onClick={() => handlePageChangeBoxPlot(currentPageBoxPlot - 1)} disabled={currentPageBoxPlot === 1} className="pagination-button">{'<'}</button>
          {renderPaginationButtonsBoxPlot()}
          <button onClick={() => handlePageChangeBoxPlot(currentPageBoxPlot + 1)} disabled={currentPageBoxPlot === totalPagesBoxPlot} className="pagination-button">{'>'}</button>
        </div>
      </div>
    </div>

    <div className="row">
      <div className="col-md-12">
          <div className="card mb-3">
            <div className="d-flex justify-content-between align-items-center card-header">
              <span className="details-text">MIN, MAX <ChartIcon /></span>

              
              <span
            className={`menu-trigger infoMinMax ${!cardVisibility.minmax ? 'disabled' : ''} ${activeButtons.infoMinMax ? 'active' : ''}`}
            onClick={() => {
              if (cardVisibility.minmax) {
                toggleMenuInfoMinMax();
                handleMenuClick('infoMinMax');
              }
            }}
              >
                  <InfoIcon style={{ width: '25px', height: '25px', marginTop: '3px' }} />
          </span>

          <div className={`menu infoMinMax ${menuOpenInfoMinMax ? 'open' : ''}`}>
            Indicates the minimum and maximum values ​​of each column using a bar graph.
          </div>

              <div className="toggle-button-cover">
                <div id="button-3" className="button r">
                  <input className="checkbox" type="checkbox" onChange={() => toggleCardVisibility('minmax')} checked={cardVisibility.minmax} />
                  <div className="knobs"></div>
                  <div className="layer"></div>
                </div>
              </div>
              </div>
          {cardVisibility.minmax && (
            <div className="card-body">
              <div style={{ height: '300px' }}>
                <Bar data={minMaxChartData} options={minMaxChartOptions} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>


    <div className="row">
      <div className="col-md-12">
          <div className="card mb-3">
            <div className="d-flex justify-content-between align-items-center card-header">
              <span className="details-text">NULL VALUES <ChartIcon /></span>

              
              <span
            className={`menu-trigger infoNullValues ${!cardVisibility.nullValues ? 'disabled' : ''} ${activeButtons.infoNullValues ? 'active' : ''}`}
            onClick={() => {
              if (cardVisibility.nullValues) {
                toggleMenuInfoNullValues();
                handleMenuClick('infoNullValues');
              }
            }}
              >
                  <InfoIcon style={{ width: '25px', height: '25px', marginTop: '3px' }} />
          </span>

          <div className={`menu infoNullValues ${menuOpenInfoNullValues ? 'open' : ''}`}>
            Shows the percentage amount of null values ​​in each column as a bar graph.
          </div>

              <div className="toggle-button-cover">
                <div id="button-3" className="button r">
                  <input className="checkbox" type="checkbox" onChange={() => toggleCardVisibility('nullValues')} checked={cardVisibility.nullValues} />
                  <div className="knobs"></div>
                  <div className="layer"></div>
                </div>
              </div>
              </div>
          {cardVisibility.nullValues && (
              <div className="card-body d-flex flex-column align-items-center">
              <div style={{ width: '100%', height: '200px' }}>
                <Bar data={nullValuesChartData} options={nullValuesChartOptions} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>


    <div className="card mb-3" style={{ marginTop: 0 }}>
      <div className="d-flex justify-content-between align-items-center card-header">
        <span className="details-text">TOP K PIE CHARTS <ChartIcon /></span>

        
              <span
            className={`menu-trigger infoColumn ${!cardVisibility.column ? 'disabled' : ''} ${activeButtons.infoColumn ? 'active' : ''}`}
            onClick={() => {
              if (cardVisibility.column) {
                toggleMenuInfoColumn();
                handleMenuClick('infoColumn');
              }
            }}
              >
                  <InfoIcon style={{ width: '25px', height: '25px', marginTop: '3px' }} />
          </span>

          <div className={`menu infoColumn ${menuOpenInfoColumn ? 'open' : ''}`}>
            Contains a pie chart for each column showing the percentage distribution of their values ​​sorted from the most frequent ones.
          </div>

        <div className="toggle-button-cover">
          <div id="button-3" className="button r">
            <input
              className="checkbox"
              type="checkbox"
              onChange={() => toggleCardVisibility('column')}
              checked={cardVisibility.column}
            />
            <div className="knobs"></div>
            <div className="layer"></div>
          </div>
        </div>
      </div>
      {cardVisibility.column && (
        <>
          <div className="card-body d-flex flex-wrap justify-content-center">
            {getPaginatedCharts().map((attribute) => {
              const dataForAttribute = getChartDataForAttribute(attribute);
              const labels = dataForAttribute.labels.map((label, index) => {
                const value = dataForAttribute.datasets[0].data[index];
                const percentage = value.toFixed(2);
                return `${label.split(':')[1]}: ${percentage}%`;
              });

              const backgroundColors = dataForAttribute.datasets[0].backgroundColor;
              const maxValues = Object.keys(relativeFrequency[attribute]).length;

              return (
                <div key={attribute} className="col-lg-6 mb-4" style={{ marginBottom: '50px' }}>
                  <h3 className="attribute-title text-center">{attribute}</h3>
                  <div className="label-boxes-container mt-2 mx-auto">
                    <div className="label-boxes"
                      style={{
                        backgroundColor: darkMode ? '#1e1e1e' : '#ffffff' 
                      }}
                    >
                      {labels.map((label, index) => (
                        <div key={index} className="label-box">
                          <div className="color-box" style={{ backgroundColor: backgroundColors[index] }}></div>
                          {' ' + label}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div style={{ height: '10px' }}></div>
                  <div className="chart-container text-center">
                    <Pie data={dataForAttribute} options={distributionChartOptions} />
                  </div>
                  <select
                    value={chartDataLimit[attribute] ?? (maxValues >= 10 ? 10 : Math.min(maxValues, 10))}
                    onChange={(e) => handleSliderChange(attribute, parseInt(e.target.value))}
                    className="form-select mt-2 mx-auto"
                    style={{ display: 'block', margin: '10px auto 0 auto', width: '80%' }}
                  >
                    {maxValues < 5 && <option value={maxValues}>{maxValues} values</option>}
                    {maxValues >= 5 && maxValues < 10 && (
                      <>
                        <option value="5">5 values</option>
                        <option value={maxValues}>{maxValues} values</option>
                      </>
                    )}
                    {maxValues >= 10 && maxValues < 20 && (
                      <>
                        <option value="5">5 values</option>
                        <option value="10">10 values</option>
                        <option value={maxValues}>{maxValues} values</option>
                      </>
                    )}
                    {maxValues >= 20 && (
                      <>
                        <option value="5">5 values</option>
                        <option value="10">10 values</option>
                        <option value="20">20 values</option>
                      </>
                    )}
                  </select>
                </div>
              );
            })}
          </div>
          <div className="pagination-container d-flex justify-content-center mt-3">
            <div className="pagination-bar">
              <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className="pagination-button">{'<'}</button>
              {renderPaginationButtons()}
              <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} className="pagination-button">{'>'}</button>
            </div>
          </div>
        </>
      )}
    </div>


    <h2 id="algorithm" className="section">ALGORITHM</h2>


    <div className="card mb-3">
      <div className="d-flex justify-content-between align-items-center card-header">
        <span className="details-text">Algorithm <PcIcon /></span>

        
        <span
            className={`menu-trigger infoAlgorithm ${!cardVisibility.algorithm ? 'disabled' : ''} ${activeButtons.infoAlgorithm ? 'active' : ''}`}
            onClick={() => {
              if (cardVisibility.algorithm) {
                toggleMenuInfoAlgorithm();
                handleMenuClick('infoAlgorithm');
              }
            }}
              >
                  <InfoIcon style={{ width: '25px', height: '25px', marginTop: '3px' }} />
          </span>

          <div className={`menu infoAlgorithm ${menuOpenInfoAlgorithm ? 'open' : ''}`}>
            Contains general details about the algorithm (name, programming language, platform, execution type).
          </div>

        <div className="toggle-button-cover">
          <div id="button-3" className="button r">
            <input
              className="checkbox"
              type="checkbox"
              onChange={() => toggleCardVisibility('algorithm')}
              checked={cardVisibility.algorithm}
            />
            <div className="knobs"></div>
            <div className="layer"></div>
          </div>
        </div>
      </div>
      {cardVisibility.algorithm && (
        <div className="card-body">
          <div className="row">
            <div className="col-md-6">
              {info.language.map((item, index) => (
                <div key={index}>
                  <strong>Name:</strong> {info.name[1]} <br />
                  <strong>Language:</strong> {info.language[index]} <br />
                  <strong>Platform:</strong> {info.platform[index]} <br />
                  <strong>Execution Type:</strong> {info.execution_type[index]}<br />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>

        
        

    <div className="row">
      <div className="col-md-6">
        <div className="card mb-3">
          <div className="d-flex justify-content-between align-items-center card-header">
            <span className="details-text">System <PcDisplayIcon /></span>

            
            <span
            className={`menu-trigger infoSystem ${!cardVisibility.system ? 'disabled' : ''} ${activeButtons.infoSystem ? 'active' : ''}`}
            onClick={() => {
              if (cardVisibility.system) {
                toggleMenuInfoSystem();
                handleMenuClick('infoSystem');
              }
            }}
              >
                  <InfoIcon style={{ width: '25px', height: '25px', marginTop: '3px' }} />
          </span>

          <div className={`menu infoSystem ${menuOpenInfoSystem ? 'open' : ''}`}>
            Provides details about the system on which the algorithm was used for discovery (operating system, processor, cores and threads, available RAM).
          </div>

            <div className="toggle-button-cover">
              <div id="button-3" className="button r">
                <input className="checkbox" type="checkbox" onChange={() => toggleCardVisibility('system')} checked={cardVisibility.system} />
                <div className="knobs"></div>
                <div className="layer"></div>
              </div>
            </div>
          </div>
          {cardVisibility.system && (
            <div className="card-body">
              {info.os.map((item, index) => (
                <div key={index}>
                  <strong>OS:</strong> {item} <br />
                  <strong>OS Version:</strong> {info.os_version[index]} <br />
                  <strong>Processor:</strong> {info.processor[index]} <br />
                  <strong>Core/Thread:</strong> {info.core[index]}/{info.thread[index]}<br />
                  <strong>RAM:</strong> {info.ram[index]} <br />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="col-md-6">
        <div className="card mb-3">
          <div className="d-flex justify-content-between align-items-center card-header">
            <span className="details-text">Execution Parameters <CpuIcon /></span>
            
            <span
              className={`menu-trigger infoPrompt ${!cardVisibility.prompt ? 'disabled' : ''} ${activeButtons.infoPrompt ? 'active' : ''}`}
              onClick={() => {
                if (cardVisibility.prompt) {
                  toggleMenuInfoPrompt();
                  handleMenuClick('infoPrompt');
                }
              }}            
            >
              <InfoIcon style={{ width: '25px', height: '25px', marginTop: '3px' }} />
            </span>



          <div className={`menu infoExecutionParameters ${menuOpenInfoExecutionParameters ? 'open' : ''}`}>
            Specifies the settings and conditions under which the algorithm was executed (command, max execution time, max RAM usage, execution start time, execution end time).
          </div>


            <div className="toggle-button-cover">
              <div id="button-3" className="button r">
                <input className="checkbox" type="checkbox" onChange={() => toggleCardVisibility('executionParameters')} checked={cardVisibility.executionParameters} />
                <div className="knobs"></div>
                <div className="layer"></div>
              </div>
            </div>
          </div>
          {cardVisibility.executionParameters && (
            <div className="card-body">
              {info.execution_command.map((item, index) => (
                <div key={index}>
                  <strong>Execution Command:</strong> {item} <br />
                  <strong>Max Execution Time:</strong> {info.max_execution_time[index]} <br />
                  <strong>Max Ram Usage:</strong> {info.max_ram_usage[index]} <br />
                  <strong>Start Time:</strong> {convertTimestampToReadable(info.start_time[index])} <br />
                  <strong>End Time:</strong> {convertTimestampToReadable(info.end_time[index])} <br />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>



    <div className="row d-flex">
      <div className="col-md-4">
          <div className={`card mb-3 w-100 ${cardVisibility.timeExecution ? 'h-100' : ''}`}>
            <div className="d-flex justify-content-between align-items-center card-header">
              <span className="details-text">Time Execution <BugIcon /></span>
              
              <span
            className={`menu-trigger infoTimeExecution ${!cardVisibility.timeExecution ? 'disabled' : ''} ${activeButtons.infoTimeExecution ? 'active' : ''}`}
            onClick={() => {
              if (cardVisibility.timeExecution) {
                toggleMenuInfoTimeExecution();
                handleMenuClick('timeExecution');
              }
            }}
              >
                  <InfoIcon style={{ width: '25px', height: '25px', marginTop: '3px' }} />
          </span>

          <div className={`menu infoTimeExecution ${menuOpenInfoTimeExecution? 'open' : ''}`}>
            Provides an overview of the times taken to execute the various phases of the algorithm (dataset loading, preprocessing, discovery, left, total).
          </div>


              <div className="toggle-button-cover">
                <div id="button-3" className="button r">
                  <input className="checkbox" type="checkbox" onChange={() => toggleCardVisibility('timeExecution')} checked={cardVisibility.timeExecution} />
                  <div className="knobs"></div>
                  <div className="layer"></div>
                </div>
              </div>
            </div>
            {cardVisibility.timeExecution && (
              <div className="card-body">
                {info.dataset_loading.map((item, index) => (
                  <div key={index}>
                    <strong>Dataset Loading:</strong> {info.dataset_loading[index] !== null ? formatTime(info.dataset_loading[index]) : 'N/A'} <br />
                    <strong>Preprocessing:</strong> {info.preprocessing[index] !== null ? formatTime(info.preprocessing[index]) : 'N/A'} <br />
                    <strong>Discovery:</strong> {info.discovery[index] !== null ? formatTime(info.discovery[index]) : 'N/A'} <br />
                    <strong>Left:</strong> {formatTime(left) !== '0ms' && formatTime(left) !== '0s' ? formatTime(left) : 'N/A'} <br />
                    <strong>Total:</strong> {info.total[index] && info.total[index].trim() !== '' ? formatTime(info.total[index]) : 'N/A'} <br />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div><div className="col-md-4">
          <div className={`card mb-3 w-100 ${cardVisibility.ramUsage ? 'h-100' : ''}`}>
            <div className="d-flex justify-content-between align-items-center card-header">
              <span className="details-text">Ram Usage <CpuIcon /></span>

              
              <span
            className={`menu-trigger infoRamUsage ${!cardVisibility.ramUsage ? 'disabled' : ''} ${activeButtons.infoRamUsage ? 'active' : ''}`}
            onClick={() => {
              if (cardVisibility.ramUsage) {
                toggleMenuInfoRamUsage();
                handleMenuClick('infoRamUsage');
              }
            }}
              >
                  <InfoIcon style={{ width: '25px', height: '25px', marginTop: '3px' }} />
          </span>

          <div className={`menu infoRamUsage ${menuOpenInfoRamUsage ? 'open' : ''}`}>
            Reports information about RAM usage during the execution of the algorithm (units of measurement, max amount of RAM used).
          </div>

              <div className="toggle-button-cover">
                <div id="button-3" className="button r">
                  <input className="checkbox" type="checkbox" onChange={() => toggleCardVisibility('ramUsage')} checked={cardVisibility.ramUsage} />
                  <div className="knobs"></div>
                  <div className="layer"></div>
                </div>
              </div>
            </div>
            {cardVisibility.ramUsage && (
              <div className="card-body">
                {info.max_ram_used.map((item, index) => (
                  <div key={index}>
                    <strong>Unit:</strong> {info.unit[1] && info.unit[1].trim() !== '' ? info.unit[1] : 'N/A'} <br />
                    <strong>Max Ram Used:</strong> {info.max_ram_used[index] !== null ? info.max_ram_used[index] : 'N/A'} <br />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="col-md-4">
          <div className={`card mb-3 w-100 ${cardVisibility.error ? 'h-100' : ''}`}>
            <div className="d-flex justify-content-between align-items-center card-header">
              <span className="details-text">Error <BugIcon /></span>

              
              <span
            className={`menu-trigger infoError ${!cardVisibility.error ? 'disabled' : ''} ${activeButtons.infoError ? 'active' : ''}`}
            onClick={() => {
              if (cardVisibility.error) {
                toggleMenuInfoError();
                handleMenuClick('infoError');
              }
            }}
              >
                  <InfoIcon style={{ width: '25px', height: '25px', marginTop: '3px' }} />
          </span>

          <div className={`menu infoError ${menuOpenInfoError ? 'open' : ''}`}>
            Shows any errors or anomalies found during the execution of the algorithm (time limit, memory limit, general error).
          </div>

              <div className="toggle-button-cover">
                <div id="button-3" className="button r">
                  <input className="checkbox" type="checkbox" onChange={() => toggleCardVisibility('error')} checked={cardVisibility.error} />
                  <div className="knobs"></div>
                  <div className="layer"></div>
                </div>
              </div>
            </div>
            {cardVisibility.error && (
                <div className="card-body">
                  {info.time_limit.map((item, index) => (
                    <div key={index}>
                      <strong>Time Limit:</strong> {item !== null ? item : 'N/A'} <br />
                      <strong>Memory Limit:</strong> {info.memory_limit[index] !== null ? info.memory_limit[index] : 'N/A'} <br />
                      <strong>General Error:</strong> {info.general_error[index] && info.general_error[index].trim() !== '' ? info.info.general_error[index] : 'N/A'} <br />
                    </div>
                  ))}
                </div>
              )}
          </div>
        </div>
      <div style={{ marginBottom: '20px' }}></div>
    </div>


    <div className="row">
      <div className="col-md-12">
        {shouldDisplayCard && (
          <div className="card mb-3">
            <div className="d-flex justify-content-between align-items-center card-header">
              <span className="details-text">TIME EXECUTION <PcIcon /></span>

              
              <span
            className={`menu-trigger infoTimeExecution2 ${!cardVisibility.timeExecution2 ? 'disabled' : ''} ${activeButtons.infoTimeExecution2 ? 'active' : ''}`}
            onClick={() => {
              if (cardVisibility.timeExecution2) {
                toggleMenuInfoTimeExecution2();
                handleMenuClick('infoTimeExecution2');
              }
            }}
              >
                  <InfoIcon style={{ width: '25px', height: '25px', marginTop: '3px' }} />
          </span>

          <div className={`menu infoTimeExecution2 ${menuOpenInfoTimeExecution2 ? 'open' : ''}`}>
            It is a single horizontal bar graph that reports in percentage all four timings of the execution algorithm (dataset loading, preprocessing, discovery, left).
          </div>

              <div className="toggle-button-cover">
                <div id="button-3" className="button r">
                  <input className="checkbox" type="checkbox" onChange={() => toggleCardVisibility('timeExecution2')} checked={cardVisibility.timeExecution2} />
                  <div className="knobs"></div>
                  <div className="layer"></div>
                </div>
              </div>
            </div>
            {cardVisibility.timeExecution2 && (
              <div className="card-body d-flex flex-column align-items-center">
                <div style={{ width: '100%', height: '200px' }}>
                  <Bar data={timeChartData} options={timeChartOptions} />
                </div>
              </div>
            )}
          </div>
        )}
    </div>


    <h2 id="dependencies"className="section">DEPENDENCIES ANALYSIS</h2> 
  

    <div className="col-md-12">
      <div className="card mb-3">
        <div className="d-flex justify-content-between align-items-center card-header">
          <span className="details-text">LHS CARDINALITY <ChartIcon /></span>

          
          <span
            className={`menu-trigger infoCardinality ${!cardVisibility.cardinality ? 'disabled' : ''} ${activeButtons.infoCardinality ? 'active' : ''}`}
            onClick={() => {
              if (cardVisibility.cardinality) {
                toggleMenuInfoCardinality();
                handleMenuClick('infoCardinality');
              }
            }}
              >
                  <InfoIcon style={{ width: '25px', height: '25px', marginTop: '3px' }} />
          </span>

          <div className={`menu infoCardinality ${menuOpenInfoCardinality ? 'open' : ''}`}>
            It is a bar chart that shows the amount of dependencies for each cardinality of the left side of a relationship. Values ​​in the legend can be selected to filter RFDs.
          </div>

          <div className="toggle-button-cover">
            <div id="button-3" className="button r">
              <input
                className="checkbox"
                type="checkbox"
                onChange={() => toggleCardVisibility('cardinality')}
                checked={cardVisibility.cardinality}
              />
              <div className="knobs"></div>
              <div className="layer"></div>
            </div>
          </div>
        </div>
        {cardVisibility.cardinality && (
          <div className="card-body">
            <div className="label-boxes-container mt-2 mx-auto">
              <div className="label-boxes"
                style={{
                backgroundColor: darkMode ? '#1e1e1e' : '#ffffff' 
                }}
              >
                {labelsAndColorsCardinality.map(([label, color], index) => (
                  <div
                    key={index}
                    className={`label-box ${cardinalityValues.includes(label) ? 'label-box-deleted' : ''}`}
                    onClick={() => handleLegendClickCardinality(label)}
                  >
                    <div className="color-box" style={{ backgroundColor: color }}
                    onClick={() => handleLegendClickCardinality(label)}
                  >
                  </div>
                    {' ' + label}
                  </div>
                ))}
              </div>
            </div>
            <div style={{ width: '100%', height: '300px' }}>
              <Bar data={lhsAttributeChartData} options={lhsAttributeChartOptions} />
            </div>
          </div>
        )}
      </div>
     </div>
    </div>
    

    <div className="card mb-12">
      <div className="d-flex justify-content-between align-items-center card-header">
        <span className="details-text">ATTRIBUTE/THRESHOLD FREQUENCY <ChartIcon /></span>
        
        
        <span
            className={`menu-trigger infoFrequency ${!cardVisibility.frequency ? 'disabled' : ''} ${activeButtons.infoFrequency ? 'active' : ''}`}
            onClick={() => {
              if (cardVisibility.frequency) {
                toggleMenuInfoFrequency();
                handleMenuClick('infoFrequency');
              }
            }}
              >
                  <InfoIcon style={{ width: '25px', height: '25px', marginTop: '3px' }} />
          </span>

          <div className={`menu infoFrequency ${menuOpenInfoFrequency? 'open' : ''}`}>
            It is a bar chart showing for each attribute the frequency of comparison thresholds. The values ​​in the legend can be selected to filter the RFDs.
          </div>
        
        <div className="toggle-button-cover">
          <div id="button-3" className="button r">
            <input
              className="checkbox"
              type="checkbox"
              onChange={() => toggleCardVisibility('frequency')}
              checked={cardVisibility.frequency}
            />
            <div className="knobs"></div>
            <div className="layer"></div>
          </div>
        </div>
      </div>
      {cardVisibility.frequency && (
        <div className="card-body">
          <div className="label-boxes-container mt-2 mx-auto">
            <div className="label-boxes"
              style={{
              backgroundColor: darkMode ? '#1e1e1e' : '#ffffff' 
              }}
            >
              {labelsAndColorsFrequency.map(([label, color], index) => (
                <div
                  key={index}
                  className={`label-box ${frequencyValues.includes(label) ? 'label-box-deleted' : ''}`}
                  onClick={() => handleLegendClickFrequency(label)}
                >
                  <div className="color-box" style={{ backgroundColor: color }}
                  onClick={() => handleLegendClickFrequency(label)}
                  >
                  </div>
                  {' ' + label}
                </div>
              ))}
            </div>
          </div>
          <div style={{ height: '300px' }}>
            <Bar data={variableChartData} options={variableChartOptions} />
          </div>
        </div>
      )}
    </div>


    <div className="card mb-3">
      <div className="d-flex justify-content-between align-items-center card-header">
        <span className="details-text">IMPLICATING ATTRIBUTES <ChartIcon /> </span>
      
        <span
            className={`menu-trigger infoImplicating ${!cardVisibility.implicating ? 'disabled' : ''} ${activeButtons.infoImplicating ? 'active' : ''}`}
            onClick={() => {
              if (cardVisibility.implicating) {
                toggleMenuInfoImplicating();
                handleMenuClick('infoImplicating');
              }
            }}
              >
                  <InfoIcon style={{ width: '25px', height: '25px', marginTop: '3px' }} />
          </span>

          <div className={`menu infoImplicating ${menuOpenInfoImplicating ? 'open' : ''}`}>
            It is a bar chart that lists for each column the union of all the attributes that imply it. The values ​​in the legend can be selected to filter the RFDs.
          </div>

        <div className="toggle-button-cover">
          <div id="button-3" className="button r">
            <input
              className="checkbox"
              type="checkbox"
              onChange={() => toggleCardVisibility('implicating')}
              checked={cardVisibility.implicating}
            />
            <div className="knobs"></div>
            <div className="layer"></div>
          </div>
        </div>
      </div>
      {cardVisibility.implicating && (
        <div className="card-body">
          <div className="label-boxes-container mt-2 mx-auto">
            <div className="label-boxes"
              style={{
              backgroundColor: darkMode ? '#1e1e1e' : '#ffffff' 
              }}
            >
              {labelsAndColorsImplicating.map(([label, color], index) => (
                <div
                  key={index}
                  className={`label-box ${implicatingValues.includes(label) ? 'label-box-deleted' : ''}`}
                  onClick={() => handleLegendClickImplicating(label)}
                >
                  <div className="color-box" style={{ backgroundColor: color }}
                  onClick={() => handleLegendClickImplicating(label)}
                >
                </div>
                  {' ' + label}
                </div>
              ))}
            </div>
          </div>
          <div style={{ height: '300px' }}>
            <Bar data={implicatingChartData} options={implicatingChartOptions} />
          </div>
        </div>
      )}
    </div>

    <div className="card mb-3">
      <div className="d-flex justify-content-between align-items-center card-header">
        <span className="details-text">
          RFDs (total: {allRFDs.length} - filtered: {filteredRFDs.length})
        </span>

        
          <span
            className={`menu-trigger infoRFD ${!cardVisibility.rfd ? 'disabled' : ''} ${activeButtons.infoRFD ? 'active' : ''}`}
            onClick={() => {
              if (cardVisibility.rfd) {
                toggleMenuInfoRFD();
                handleMenuClick('infoRFD');
              }
            }}
          >
            <InfoIcon style={{ width: '25px', height: '25px', marginTop: '3px' }} />
          </span>

          <span
            className={`menu-trigger ${!cardVisibility.rfd ? 'disabled' : ''} ${activeButtons.filter ? 'active' : ''}`}
            onClick={() => {
              if (cardVisibility.rfd) {
                toggleMenuFilter();
                handleMenuClick('filter');
              }
            }}
          >
            ...
          </span>
      
        <div className="toggle-button-cover">
          <div id="button-3" className="button r">
            <input
              className="checkbox"
              type="checkbox"
              onChange={() => {
                toggleCardVisibility('rfd');
              }}
              checked={cardVisibility.rfd}
            />
            <div className="knobs"></div>
            <div className="layer"></div>
          </div>
        </div>
      </div>

      <div className={`menu infoRFD ${menuOpenInfoRFD ? 'open' : ''}`}>
        A Relaxed Functional Dependency (RFD) is a relationship between attributes where the left-hand side<br/> (LHS) set of attributes determines the right-hand side (RHS) 
        attribute, with specified tolerance thresholds.<br/> The notation follows this format: <i>attribute@[x.x], attribute@[x.x], ... -&gt; attribute@[x.x]</i>, with the 
        LHS<br/> attributes separated from the RHS attribute by the symbol -&gt; and each attribute is associated with a<br/> tolerance threshold in square brackets.
      </div>

      <div className={`menu ${menuOpenFilter ? 'open' : ''}`}>
  <b>FILTERS*</b><br /><br />
  <b>Attributes header :</b> {selectedHeaderValues.join(', ')}<br />
  <b>LHS cardinality :</b> {cardinalityValues.join(', ')}<br />
  <b>Frequency :</b> {frequencyValues.join(', ')}<br />
  <b>Attributes header implicated :</b> {implicatingValues.join(', ')}<br />
  <b>Selected Dependencies :</b> {selectedRFDIds.length} <br /><br />
  <i>* = dependencies with these features are not included in this list</i>
</div>


      {cardVisibility.rfd && (
        <div className="card-body">
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <input
              type="checkbox"
              className="select-btn larger-checkbox"
              checked={selectedRFDIds.length === filteredRFDs.length}
              onChange={toggleSelectAll}
            />
            <label style={{ marginLeft: '10px' }}>
              {selectedRFDIds.length === filteredRFDs.length ? "Deselect all" : "Select all"}
            </label>
          </div>
          <hr></hr>
          <div
            style={{
              maxHeight: filteredRFDs.length > 12 ? '400px' : 'auto',
              overflowY: filteredRFDs.length > 12 ? 'scroll' : 'visible',
              whiteSpace: 'pre-wrap',
            }}
          >
            {filteredRFDs.map((rfdObj) => (
              <div key={rfdObj.id} style={{ marginBottom: '10px', display: 'flex', alignItems: 'center' }}>
                <input
                  type="checkbox"
                  className="larger-checkbox"
                  checked={selectedRFDIds.includes(rfdObj.id)}
                  onChange={() => toggleRowSelection(rfdObj.id)}
                />
                <label style={{ marginLeft: '10px' }}>
                  {rfdObj.rfd}
                </label>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>



    <div className="card mb-3">
      <div className="d-flex justify-content-between align-items-center card-header">
        <span className="details-text">PROMPT <CpuIcon /></span>

      <span
            className={`menu-trigger infoPrompt ${!cardVisibility.prompt ? 'disabled' : ''} ${activeButtons.infoPrompt ? 'active' : ''}`}
            onClick={() => {
              if (cardVisibility.executionParameters) {
                toggleMenuInfoExecutionParameters();
                handleMenuClick('infoExecutionParameters');
              }
            }}            
          >
              <InfoIcon style={{ width: '25px', height: '25px', marginTop: '3px' }} />
      </span>

        <div className="toggle-button-cover">
          <div id="button-3" className="button r">
            <input
              className="checkbox"
              type="checkbox"
              onChange={() => toggleCardVisibility('prompt')}
              checked={cardVisibility.prompt}
            />
            <div className="knobs"></div>
            <div className="layer"></div>
          </div>
        </div>
      </div>

      <div className={`menu infoPrompt ${menuOpenInfoPrompt ? 'open' : ''}`}>
        There are two types of automatically generated prompts available. The first prompt solely requires an<br/> explanation and analysis of the selected dependencies. 
        The second prompt, similar to the first, adds a<br/> request for an explanation of the dependencies while incorporating distribution values, such as the most<br/>
        common values for each column in the dataset, along with the mean, median, and mode. You can select<br/> from a dropdown menu one of the three available LLMs 
        (Large Language Models) to use for sending<br/> the prompts and requesting a summary.
      </div>

      {cardVisibility.prompt && (
        <div className="card-body">
          <textarea
            className='prompt-textbox'
            type="text"
            value={customPromptAI}
            onChange={handleTextareaChange}
            style={{ width: "100%", minHeight: "220px" }}
          />
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "10px" }}>
            <div style={{ display: "flex", gap: "10px" }}>
              <select
                className="form-select mt-2"
                style={{ display: 'block', marginLeft: '0', width: '300px' }}
                value={selectedPrompt}
                onChange={handlePromptChange}
              >
                {Object.keys(prompts).map((prompt, index) => (
                  <option key={index} value={prompt}>
                    {prompt}
                  </option>
                ))}
              </select>
              <select
                className="form-select mt-2"
                style={{ display: 'block', marginLeft: '0', width: '300px' }}
                value={selectedLLM}
                onChange={handleLLMChange}
              >
                <option value="ChatGPT3.5">ChatGPT3.5</option>
                <option value="Llama3">Llama3</option>
                <option value="Gemma">Gemma</option>
              </select>
            </div>
            <button className="select-btn" onClick={scrollToBottom} disabled={isLoading}>
              {isLoading ? "LOADING..." : "EXPLANATION"}
            </button>
          </div>
        </div>
      )}
    </div>
    
    {
      visibility.explanation2 ? (
        <div className="card mb-3">
          <div className="d-flex justify-content-between align-items-center card-header">
            <span className="details-text">EXPLANATION <RobotIcon /></span>
            <div className="toggle-button-cover">
              <div id="button-3" className="button r">
                <input
                  className="checkbox"
                  type="checkbox"
                  onChange={() => toggleCardVisibility('explanation')}
                  checked={cardVisibility.explanation}
                />
                <div className="knobs"></div>
                <div className="layer"></div>
              </div>
            </div>
          </div>
          {cardVisibility.explanation && (
            <div className="card-body">
              {isTextGenerated && (
                <>
                  <p>{responseAI}</p>
                  <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "10px" }}>
                    <button className="select-btn" onClick={summarizeText} disabled={isLoading2}>
                      {isLoading2 ? "LOADING..." : "SUMMARY"}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      ) : ( null )
    }
    

    {
      visibility.summary2 ? (
        <div className="card mb-3">
      <div className="d-flex justify-content-between align-items-center card-header">
        <span className="details-text">SUMMARY <RobotIcon /></span>
        <div className="toggle-button-cover">
          <div id="button-3" className="button r">
            <input
              className="checkbox"
              type="checkbox"
              onChange={() => toggleCardVisibility('summary')}
              checked={cardVisibility.summary}
            />
            <div className="knobs"></div>
            <div className="layer"></div>
          </div>
        </div>
      </div>
      {cardVisibility.summary && (
        <div className="card-body">
          {isTextGenerated2 && (
            <p>{responseAI2}</p>
          )}
        </div>
      )}
    </div>

      ) : (null)
    }
    
    </div>
  </div>

    

  );
};

export default FileDetailsPage;