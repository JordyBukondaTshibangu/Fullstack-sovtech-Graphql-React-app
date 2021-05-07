const bcrypt = require('bcrypt')
const { sign } = require('jsonwebtoken')
const { checkAuth } = require('../middleware/auth-middleware')

module.exports.resolverUser = {
	Query: {
		me: async (_, __, { prisma, req }) => {
			const user = checkAuth(req)

			const me = await prisma.user.findMany({ where: { email: user.email } })

			return me[0]
		},
	},
	Mutation: {
		register: async (
			_,
			{ createdUser: { name, email, dateOfBirth, country, password } },
			context
		) => {
			const encryptedPassword = await bcrypt.hash(password, 8)

			const newUser = await context.prisma.user.create({
				data: {
					name,
					email,
					dateOfBirth,
					country,
					password: encryptedPassword,
				},
			})

			const token = await sign({ email }, 'Thisismysecretkey', {
				expiresIn: '3h',
			})

			return {
				...newUser,
				token,
			}
		},
		login: async (_, { email, password }, context) => {
			const user = await context.prisma.user.findMany({
				where: {
					email,
				},
			})

			const userRetrieved = user[0]
			const result = await bcrypt.compare(password, userRetrieved.password)

			const token = await sign({ email }, 'Thisismysecretkey', {
				expiresIn: '3h',
			})

			if (result) {
				return {
					...userRetrieved,
					token,
				}
			}
		},
		updateProfile: (
			_,
			{ updatedUser: { name, email, dateOfBith, country } },
			{ prisma, req }
		) => {
			const user = checkAuth(req)

			const updateUser = prisma.user.update({
				where: {
					email: user.email,
				},
				data: {
					name,
					email,
					dateOfBith,
					country,
				},
			})
			return updateUser
		},
		deleteProfile: (_, __, { prisma, req }) => {
			const user = checkAuth(req)

			const deleteUser = prisma.user.delete({
				where: { email: user.email },
			})

			return deleteUser
		},
	},
}
