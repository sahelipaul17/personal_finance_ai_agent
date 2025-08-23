
// import readline from 'node:readline/promises';
// import readline from 'node:readline';

import promptSync from 'prompt-sync';
import { Groq } from "groq-sdk";

const expensesDB = [];

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

async function callAgent() {

    const prompt = promptSync();
    

    const messages = [
        {
            role: "system",
            content: `You are Alina, a personal financial advisor.Your task is to assist user their expenses,balances and financial planning, current datetime: ${new Date().toUTCString()}`
        },
    ];
      

    //this is for user prompt loop
    while(true){
        const userQuestion = prompt("User: ");
          if(userQuestion === "exit" || "bye"){
            break;
          }
          messages.push({
            role: "user",
            content: userQuestion,
          })
        //this is for agent
        while (true) {
            const completion = await groq.chat.completions
                .create({
                    messages: messages,
                    model: "llama-3.3-70b-versatile",
                    tools: [{
                        type: "function",
                        function: {
                            name: "getTotalExpenses",
                            description: "Get total expenses from date to date of user",
                            parameters: {
                                type: "object",
                                properties: {
                                    from: {
                                        type: "string",
                                        description: "From date in dd-mm-yyyy format to get the expenses",
                                    },
                                    to: {
                                        type: "string",
                                        description: "To date in dd-mm-yyyy format to get the expenses",
                                    },
                                },
                            },
                        }
                    },
                    {
                        type: "function",
                        function: {
                            name: "addExpenses",
                            description: "Add expenses to the user",
                            parameters: {
                                type: "object",
                                properties: {
                                    name: {
                                        type: "string",
                                        description: "Name of the expense , example : bought a book",
                                    },
                                    amount: {
                                        type: "string",
                                        description: "Amount of the expense, example : 100 INR",
                                    },
                                },
                            },
                        }
                    }]
                })
            
            // console.log(JSON.stringify(completion.choices[0], null, 2));
    
            messages.push(
                completion.choices[0].message,
            )
            const toolCall = completion.choices[0].message.tool_calls;
            if (!toolCall) {
                console.log(`Assistant:${completion.choices[0].message.content}`);
                break;
            }
            
            for (const tool of toolCall) {
                const functionName = tool.function.name;
                const functionArgs = tool.function.arguments;
    
                let result = ""
                if (functionName === "getTotalExpenses") {
                    result = getTotalExpenses(JSON.parse(functionArgs));
                }
                else if (functionName === "addExpenses") {
                    result = addExpenses(JSON.parse(functionArgs));
                }
                messages.push({
                    role: "tool",
                    content: result,
                    tool_call_id: tool.id,
                })
                // console.log(JSON.stringify(completion2.choices[0], null, 2));
            }
        }
    }
}
callAgent()

/**
 * Get total expenses of user
 */

function getTotalExpenses({ from, to }) {
    // console.log(`Total expenses from ${from} to ${to}`)
    const expense = expensesDB.reduce((acc,item)=>{
        return acc + item.amount;
    },0)
    return `${expense} INR`;
}

function addExpenses({name,amount}) {
    // console.log(`Expense added ${name} : ${amount}`)
    expensesDB.push({name, amount});

    return `Expense added to the database ${name} : ${parseInt(amount)}`;
}

