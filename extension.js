// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');


/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {

	// Respond to the event whenever a document is saved by the user.
	let disposable = vscode.workspace.onDidSaveTextDocument((documentSaved) =>{				

		// Only work on files named variables.tf 
		// We can assume that only variables will be declared in this file
		// This is a Terraform standard.
		if (!documentSaved.fileName.includes("variables.tf")) return;   

		// Declare an array to hold the variables
		let variables = []

		// Retrieve the text from the document that was saved.
		let text = documentSaved.getText();					
		
		// As we process the text, it will descrease in length
		// The idea is to read a piece of data of find a delimiter and once found
		// we delete that part of the text because we don't need it anymore.
		while(text.length > 0)
		{
			// Create a place holder for the name of the variable and its content
			// The content will be everything from the first "{" to the last "}" of the
			// variable declaration block.
			let variableName = ""
			let variableContent = ""

			// The delimiter count is what we use to determine if we are at the the final "}"
			// or if we are reading one that is inside the varaible for another statement.
			let delimiterCount = 0

			// First find where the variable keyword starts and remove it
			let indexOfVariable = text.indexOf("variable")
			text = text.substring(indexOfVariable + 8, text.length);

			// Now find the first quotation and remove it, this is where the name starts
			let indexOfQuote = text.indexOf("\"");
			text = text.substring(indexOfQuote + 1, text.length)

			// Now find the matching quotation.  Everything in between is the variable name.
			indexOfQuote = text.indexOf("\"");
			variableName = text.substring(0, indexOfQuote);

			// Find the first "{" and remove everything before.  Everything after is our content.
			text = text.substring(text.indexOf("{"), text.length);

			// Now we'll loop through character by charcter building the content part of the object.
			let index = 0
			do{
				let character = text.charAt(index)

				// We increase the count of delmiters for "{"
				// This means we have more matching braces to find.
				if(character == "{")
				{
					delimiterCount++
				}
				// We decrease the count of delimiter for "}"
				// This means we have found a match and are running out of other
				// delimiters to be concerned with.
				else if(character == "}"){
					delimiterCount--
				}
				
				// No matter what add the character to the content and advance to the next index.
				variableContent += character
				index++

			}while(delimiterCount > 0)
			
			// Now that we are out of the variable block adjust the text to remove this content
			// We will no move on to the next variable declaration.
			text = text.substring(index, text.length);

			if(variableName != "" && variableName != " ") {
				// Add a new variable to our list.
				variables.push({
					name : variableName,
					content : variableContent
				})
			}			
		}

		// Sort the variables in alphabetic order
		variables.sort((a,b) => a.name.localeCompare(b.name))
		
		// Create a placeholder for the new text to be saved back
		let newDocumentText = ""

		// Create the new variable declaration
		// This will make sure to add an empty space after each variable.
		variables.forEach(variable => {

			if(variable.name != "" && variable.name != " ") {
				newDocumentText += "variable \"" + variable.name + "\" " + variable.content + "\r\n" + "\r\n"
			}
			
		})

		// Write the contents to the file 
		let fs = require("fs")

		fs.writeFile(documentSaved.fileName, newDocumentText);
		
	})

	context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
function deactivate() {}

module.exports = {
	activate,
	deactivate
}
