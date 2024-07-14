# Echo Mail

This readme provides instructions for building and running the app using Docker Compose.

## Prerequisites
Before proceeding, make sure you have the following installed on your machine:
- Docker
- Docker Compose

## Brainstorming
The initial brainstorming for the echomail app was done on Whimsical. You can find the diagram [here](https://whimsical.com/echomail-JoBi69g3KTeMWYFsDRNbBx).

## Build Instructions
To build the echomail app, follow these steps:
1. Clone the repository to your local machine.
2. Navigate to the project directory.
3. Open a terminal or command prompt.
4. Run the following command to build the Docker image:
  ```
  docker build -t app-name .
  ```

## Compose Instructions
To run the echomail app using Docker Compose, follow these steps:
1. Make sure you are in the project directory.
2. Open the `docker-compose.yml` file.
3. Add the necessary environment variables under the `environment` section.
4. Save the file.
5. Open a terminal or command prompt.
6. Run the following command to start the containers:
  ```
  docker-compose up -d
  ```

## Accessing the App
Before accessing the app, you need to expose the local port using ngrok. Follow these steps:
1. Make sure the containers are up and running.
2. Open a terminal or command prompt.
3. Run the following command to expose the port:
  ```
  ngrok http port

  Replace `port` with the port specified in the Docker Compose file.
  ```
4. Once ngrok is running, you can access the app by opening a web browser and navigating to the provided ngrok URL.



