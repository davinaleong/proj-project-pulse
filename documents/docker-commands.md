# Docker Commands Cheat Sheet

## 🧱 **Container Basics**

| Command            | Description              |
| ------------------ | ------------------------ |
| `docker --version` | Check Docker version     |
| `docker info`      | Display system-wide info |
| `docker help`      | Show all commands        |

---

## 🚀 **Images**

| Command                          | Description                    |
| -------------------------------- | ------------------------------ |
| `docker images`                  | List all images                |
| `docker pull <image>`            | Download image from Docker Hub |
| `docker build -t <name>:<tag> .` | Build image from Dockerfile    |
| `docker tag <source> <target>`   | Tag an image                   |
| `docker rmi <image>`             | Remove image                   |
| `docker inspect <image>`         | Show image details             |
| `docker history <image>`         | Show image history/layers      |

---

## 📦 **Containers**

| Command                                  | Description                             |
| ---------------------------------------- | --------------------------------------- |
| `docker ps`                              | List running containers                 |
| `docker ps -a`                           | List all containers (including stopped) |
| `docker run <image>`                     | Run container from image                |
| `docker run -it <image> /bin/bash`       | Run interactively with a shell          |
| `docker run -d <image>`                  | Run in detached mode                    |
| `docker exec -it <container> /bin/bash`  | Access a running container shell        |
| `docker start <container>`               | Start a stopped container               |
| `docker stop <container>`                | Stop a running container                |
| `docker restart <container>`             | Restart container                       |
| `docker kill <container>`                | Force stop container                    |
| `docker rm <container>`                  | Remove container                        |
| `docker logs <container>`                | View logs                               |
| `docker logs -f <container>`             | Follow logs in real-time                |
| `docker inspect <container>`             | View container details                  |
| `docker top <container>`                 | Show running processes in container     |
| `docker cp <container>:/path /localpath` | Copy file/folder from container         |
| `docker commit <container> <image>`      | Save container as new image             |

---

## 🧩 **Docker Compose**

| Command                            | Description                     |
| ---------------------------------- | ------------------------------- |
| `docker compose up`                | Start all services              |
| `docker compose up -d`             | Start in detached mode          |
| `docker compose down`              | Stop and remove services        |
| `docker compose ps`                | List services                   |
| `docker compose logs`              | Show logs                       |
| `docker compose logs -f`           | Follow logs                     |
| `docker compose build`             | Build/rebuild services          |
| `docker compose restart`           | Restart services                |
| `docker compose exec <service> sh` | Access a service shell          |
| `docker compose config`            | Validate and view merged config |

> 📝 Newer syntax uses `docker compose` (space) instead of the old `docker-compose`.

---

## 🧰 **Volumes & Networks**

| Command                                           | Description                       |
| ------------------------------------------------- | --------------------------------- |
| `docker volume ls`                                | List all volumes                  |
| `docker volume create <name>`                     | Create a new volume               |
| `docker volume inspect <name>`                    | Show volume details               |
| `docker volume rm <name>`                         | Remove a volume                   |
| `docker network ls`                               | List networks                     |
| `docker network create <name>`                    | Create new network                |
| `docker network inspect <name>`                   | Show network details              |
| `docker network rm <name>`                        | Remove network                    |
| `docker network connect <network> <container>`    | Connect container to network      |
| `docker network disconnect <network> <container>` | Disconnect container from network |

---

## 🧹 **Cleanup**

| Command                  | Description                                                  |
| ------------------------ | ------------------------------------------------------------ |
| `docker system prune`    | Remove stopped containers, unused networks & dangling images |
| `docker system prune -a` | Remove all unused images & containers                        |
| `docker image prune`     | Remove dangling images only                                  |
| `docker container prune` | Remove stopped containers                                    |
| `docker volume prune`    | Remove unused volumes                                        |

---

## ⚙️ **Dockerfile Shortcuts**

| Instruction  | Description                     |
| ------------ | ------------------------------- |
| `FROM`       | Base image                      |
| `RUN`        | Execute a command               |
| `CMD`        | Default command                 |
| `ENTRYPOINT` | Executable to run               |
| `COPY`       | Copy files from host            |
| `ADD`        | Copy files (can fetch URLs/tar) |
| `EXPOSE`     | Declare port                    |
| `ENV`        | Set environment variable        |
| `WORKDIR`    | Set working directory           |
| `USER`       | Set default user                |
| `VOLUME`     | Define mount point              |

---

## 🧩 **Examples**

```bash
# Build and run container
docker build -t myapp .
docker run -d -p 8080:80 myapp

# Stop and remove everything
docker stop $(docker ps -aq)
docker rm $(docker ps -aq)
docker rmi $(docker images -q)

# See system usage
docker system df
```
